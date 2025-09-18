import { feilregistrerKabalBehandlinger } from '@/setup/feilregistrer-and-delete';

export default async () => {
  console.debug('Running global teardown tasks...');

  await feilregistrerKabalBehandlinger();
};
