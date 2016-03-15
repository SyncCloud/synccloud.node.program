import B from 'bluebird';

B.config({
  longStackTraces: true
});

export default function main(Program) {
  (async () => {
    try {
      const app = await Program.createAppAsync();

      process.once('SIGINT', () => {
        app.stopAsync();
        setTimeout(() => {
          console.warn('Interruption timed out');
          process.exit(2);
        }, 30000);
      });

      await app.startAsync();
      process.exit(0);
    }
    catch (exc) {
      console.warn('Fatal error:');
      console.error(exc.stack || exc);
      process.exit(1);
    }
  })();
}


