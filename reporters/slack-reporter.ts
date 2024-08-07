/* eslint-disable max-lines */
import nodePath from 'path';
import { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult, TestStep } from '@playwright/test/reporter';
import { SlackMessageThread, getSlack } from '../slack/slack-client';
import { SlackIcon, asyncForEach, delay, getFullStatusIcon, getTestStatusIcon, getTestTitle } from './functions';

interface TestSlackData {
  icon: SlackIcon;
  title: string;
  status: string;
  steps: Map<TestStep, TestSlackData>;
}

class SlackReporter implements Reporter {
  private slack = getSlack();
  private thread?: SlackMessageThread;
  private mainMessage = '';
  private testStatuses: Map<TestCase, TestSlackData> = new Map();
  private totalTests = 0;
  private completedTests = 0;
  private failedTestCount = 0;
  private creatingSlackMessage = false;
  private timer: NodeJS.Timeout | null = null;
  private startTime = Date.now();
  private name = '';

  private async setTestMessage(test: TestCase, status: TestSlackData) {
    this.testStatuses.set(test, status);

    return await this.updateMessage();
  }

  private async updateTestMessage(test: TestCase, status: Partial<Omit<TestSlackData, 'title'>>) {
    const existing = this.testStatuses.get(test);

    if (typeof existing === 'undefined') {
      return;
    }

    return await this.setTestMessage(test, { ...existing, ...status });
  }

  private async updateMainMessage(msg: string) {
    this.mainMessage = msg;
    await this.updateMessage();
  }

  private async updateMessage() {
    const orderedTests = formatMessage(Array.from(this.testStatuses.values()));

    const message = [`*${this.name} - ${this.mainMessage}*`, '', orderedTests].join('\n');

    if (this.slack === null) {
      // eslint-disable-next-line no-console
      console.log('');
      // eslint-disable-next-line no-console
      console.log(message);

      return;
    }

    // If it is currently creating a Slack message/thread.
    if (this.creatingSlackMessage) {
      if (this.timer !== null) {
        clearTimeout(this.timer);
      }

      // Retry in 100ms, hopefully the message/thread exists by then.
      return new Promise<void>((res) => {
        this.timer = setTimeout(async () => {
          await this.updateMessage();
          res();
        }, 100);
      });
    }

    // If there is no Slack message/thread.
    if (typeof this.thread === 'undefined' && !this.creatingSlackMessage) {
      // If it has not yet started to create a Slack message/thread, do so and set the flag.
      this.creatingSlackMessage = true;
      this.thread = await this.slack?.postMessage(this.mainMessage);
      this.creatingSlackMessage = false;
    }

    await this.thread?.update(message);
  }

  async onBegin(config: FullConfig, suite: Suite) {
    const allTests = suite.allTests();
    this.totalTests = allTests.length;

    this.name = config.projects.map(({ name }) => name).join(', ');

    this.mainMessage = `Running ${this.totalTests} E2E tests with ${config.workers} workers...`;
    allTests.forEach((test) =>
      this.testStatuses.set(test, {
        icon: SlackIcon.WAITING,
        title: getTestTitle(test),
        status: 'Waiting...',
        steps: new Map(),
      }),
    );
    this.updateMessage();
  }

  async onTestBegin(test: TestCase) {
    this.updateTestMessage(test, { icon: SlackIcon.RUNNING, status: 'Running...' });
  }

  async onStepBegin(test: TestCase, result: TestResult, step: TestStep) {
    const data = this.testStatuses.get(test);

    if (typeof data === 'undefined' || step.category !== 'test.step') {
      return;
    }

    data.steps.set(step, {
      title: step.title,
      icon: SlackIcon.RUNNING,
      status: 'Running...',
      steps: new Map(),
    });
  }

  async onStepEnd(test: TestCase, result: TestResult, step: TestStep) {
    const data = this.testStatuses.get(test);

    if (typeof data === 'undefined' || !data.steps.has(step)) {
      return;
    }

    data.steps.set(step, {
      title: step.title,
      icon: typeof step.error === 'undefined' ? SlackIcon.SUCCESS : SlackIcon.WARNING,
      status: `${(step.duration / 1_000).toFixed(1)}s`,
      steps: new Map(),
    });
  }

  async onTestEnd(test: TestCase, result: TestResult) {
    const icon = getTestStatusIcon(test, result.status);
    const title = getTestTitle(test);
    this.updateTestMessage(test, { icon, status: `${(result.duration / 1_000).toFixed(1)}s` });

    const isFailed = result.status === 'failed' || result.status === 'timedOut';

    if (isFailed) {
      this.failedTestCount += 1;

      if (typeof result?.error?.stack === 'undefined') {
        const log = [`${title} - stacktrace`, '```', 'No stacktrace', '```'];
        await this.thread?.reply(log.join('\n'));
      } else {
        const partLength = 3_000;

        const firstStack = result.error.stack.substring(0, partLength);
        const firstLog = [`${title} - stacktrace`, '```', firstStack, '```'];
        await this.thread?.reply(firstLog.join('\n'));

        for (let i = 1; i * partLength < result.error.stack.length; i++) {
          const stack = result.error.stack.substring(i * partLength, (i + 1) * partLength);
          const log = ['```', stack, '```'];
          await this.thread?.reply(log.join('\n'));
        }
      }
    }

    const atttachments = isFailed ? prepareFailedResult(result) : preparePassedResult(result);

    await asyncForEach(atttachments, async ({ name, path, body, contentType }) => {
      if (contentType === 'text/plain' && body instanceof Buffer) {
        return await this.thread?.reply([':warning: *Warning*', '```', body.toString('utf-8'), '```'].join('\n'));
      }

      if (typeof path === 'undefined') {
        return;
      }

      const filename = name + nodePath.extname(path);

      if (name === 'trace') {
        return await this.thread?.replyFilePath(
          path,
          `${title} - \`${name}\`\n\`npx playwright show-trace ${filename}\``,
          test.title,
          filename,
        );
      }

      return await this.thread?.replyFilePath(path, `${title} - ${name}`, test.title, filename);
    });

    this.completedTests += 1;
  }

  async onEnd(result: FullResult) {
    const icon = getFullStatusIcon(result);
    const duration = (Date.now() - this.startTime) / 1_000;
    const tag = this.slack?.tagChannelOnError === 'true' ? '<!channel> ' : '';

    if (result.status === 'passed') {
      await this.updateMainMessage(`${icon} All ${this.totalTests} tests succeeded! \`${duration}s\``);
    } else if (result.status === 'failed') {
      await this.updateMainMessage(
        `${tag} ${icon} ${this.failedTestCount} of ${this.totalTests} tests failed! \`${duration}s\``,
      );
    } else if (result.status === 'timedout') {
      await this.updateMainMessage(
        `${tag} ${icon} Global timeout! ${this.failedTestCount} of ${this.totalTests} tests failed! \`${duration}s\``,
      );
    }

    // Wait for all tests to be done sending to Slack.
    while (this.completedTests < this.totalTests) {
      await delay(200);
    }
  }
}

const ORDER = ['warningMessage', 'video', 'screenshot', 'trace'];

const prepareFailedResult = (result: TestResult) =>
  result.attachments.sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));

const preparePassedResult = (result: TestResult) => result.attachments.filter(({ name }) => name === 'warningMessage');

const formatMessage = (tests: TestSlackData[], level = 0): string => {
  const indent = '\t'.repeat(level);

  return tests
    .map(({ icon, status, title, steps }) => {
      if (steps.size === 0) {
        return `${indent}${icon} ${title} \`${status}\``;
      }

      const a = `${indent}${icon} ${title} \`${status}\`\n${formatMessage(Array.from(steps.values()), level + 1)}`;

      return a;
    })
    .join('\n');
};

// eslint-disable-next-line import/no-unused-modules, import/no-default-export
export default SlackReporter;
