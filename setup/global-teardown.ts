import { deleteKabalBehandlinger } from '@/setup/delete-kabal-behandlinger';

export default async () => {
  console.debug('Running global teardown tasks...');

  await deleteKabalBehandlinger('global_teardown');
};
