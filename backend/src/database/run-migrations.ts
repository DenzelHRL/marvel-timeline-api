import { AppDataSource } from './data-source';

async function main(): Promise<void> {
  const action = process.argv[2] ?? 'run';
  if (!['run', 'revert', 'show'].includes(action)) {
    throw new Error('Use run, revert ou show.');
  }

  await AppDataSource.initialize();
  try {
    if (action === 'run') {
      const done = await AppDataSource.runMigrations();
      console.log(`Migrations executadas: ${done.length}`);
    } else if (action === 'revert') {
      await AppDataSource.undoLastMigration();
      console.log('Última migration revertida.');
    } else {
      console.log(
        `Há migrations pendentes: ${await AppDataSource.showMigrations()}`,
      );
    }
  } finally {
    await AppDataSource.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
