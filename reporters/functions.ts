import { FullResult, TestCase, TestStatus } from '@playwright/test/reporter';

export const getTestTitle = (test: TestCase) => {
  const [, , , description, testName] = test.titlePath();

  return `${description} - ${testName}`;
};

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const asyncForEach = async <T>(array: T[], callback: (element: T) => Promise<unknown>): Promise<void> => {
  for (let i = 0; i < array.length; i++) {
    await callback(array[i]);
  }
};

export const getTestStatusIcon = (test: TestCase, status: TestStatus): SlackIcon => {
  const outcome = test.outcome();

  if (outcome === 'expected') {
    return SlackIcon.SUCCESS;
  }

  if (outcome === 'flaky') {
    return SlackIcon.SKEPTIC;
  }

  if (outcome === 'unexpected') {
    return SlackIcon.WARNING;
  }

  if (outcome === 'skipped') {
    return SlackIcon.QUESTION;
  }

  return getStatusIcon(status);
};

export enum SlackIcon {
  // WARNING = ':warning:',
  WARNING = '💩',
  // SUCCESS = ':white_check_mark:',
  SUCCESS = '✅',
  // WAITING = ':hourglass:',
  WAITING = '⏳',
  // TIMED_OUT = ':timer_clock:',
  TIMED_OUT = '💤',
  // QUESTION = ':question:',
  QUESTION = '❓',
  // TADA = ':tada:',
  TADA = '🎉',
  // SKEPTIC = ':face_with_raised_eyebrow:',
  SKEPTIC = '🤔',
  // RUNNING = ':meow_code:',
  RUNNING = '🧪',
}

const getStatusIcon = (status: TestStatus): SlackIcon => {
  switch (status) {
    case 'failed':
      return SlackIcon.WARNING;
    case 'passed':
      return SlackIcon.SUCCESS;
    case 'timedOut':
      return SlackIcon.TIMED_OUT;
    case 'skipped':
      return SlackIcon.QUESTION;
    default:
      return SlackIcon.QUESTION;
  }
};

export const getFullStatusIcon = ({ status }: FullResult): SlackIcon => {
  switch (status) {
    case 'failed':
      return SlackIcon.WARNING;
    case 'passed':
      return SlackIcon.TADA;
    case 'timedout':
      return SlackIcon.TIMED_OUT;
    case 'interrupted':
      return SlackIcon.QUESTION;
    default:
      return SlackIcon.QUESTION;
  }
};
