import fs from 'fs';
import path from 'path';
import Config from '@synccloud/config';
import {assertType, Deferred, CancellationSource} from '@synccloud/utils';
import {Log, JsonFormatter, BufferFormatter, trace, ConsoleTarget, Logger, StreamTarget} from '@synccloud/logging';

const {LOG_LEVEL} = process.env;

export default class Program {
  get cancellation() { return this._cancellation.token; }

  toJSON() {
    return {
      options: this.options
    };
  }

  async _setupAsync() {
    await this._setupLoggingAsync();
    await this._setupOptionsAsync();
  }

  _setupTraceLogger() {
    const traceFileTarget = new StreamTarget(fs.createWriteStream('./trace.log'));
    this.traceLogger.targets.add(traceFileTarget);
    for (let f of this._getTraceLoggerFormatters()) {
      this.traceLogger.formatters.append(f);
    }
  }

  _getTraceLoggerFormatters() {
    return [
      new BufferFormatter,
      new JsonFormatter
    ];
  }

  _setupMainLogger() {
    const consoleTarget = new ConsoleTarget();
    this.logger.targets.add(consoleTarget);
    for (let f of this._getMainLoggerFormatters()) {
      this.logger.formatters.append(f);
    }
  }

  _getMainLoggerFormatters() {
    return [
      new JsonFormatter({compact: true})
    ];
  }

  async _setupLoggingAsync() {
    if (LOG_LEVEL == 'trace') {
      const traceLogger = this.traceLogger = new Logger();
      this._setupTraceLogger();
      trace.setup(traceLogger);
    }

    const mainLogger = this.logger = new Logger();
    this._setupMainLogger();
    Log.setup(mainLogger);
  }

  @trace
  async _setupOptionsAsync() {
    const options = await Config.getOptionsAsync(path.join(__dirname, '..'));
    await this._assertOptionsAsync(options);
    this.options = options;
  }

  @trace
  async startAsync(cancellation) {
    Log.info(
      () => ({
        msg: 'Starting',
        app: this
      }),
      (x) => x.message.msg);

    this.completion = new Deferred();
    this._cancellation = cancellation || new CancellationSource();

    await this._runAsync();
  }

  @trace
  async stopAsync() {
    Log.info(
      () => ({
        msg: 'Stopping',
        app: this
      }),
      (x) => x.message.msg);

    this._cancellation.cancel();
    await this.completion;
  }

  @trace
  async _runAsync() {
    this.cancellation.assert();

    let error;

    try {
      Log.info(
        () => ({
          msg: 'Started',
          app: this
        }),
        (x) => x.message.msg);

      await this._mainAsync();
    }
    catch (exc) {
      Log.error(
        () => ({
          msg: 'Fatal error',
          app: this,
          exception: exc
        }),
        (x) => `${x.message.msg}:\n` +
        Log.format(x.message.exception));
      error = exc;
    }
    finally {
      Log.info(
        () => ({
          msg: 'Stopped',
          app: this
        }),
        (x) => x.message.msg);
      error ? this.completion.resolve() : this.completion.reject(error);
    }
  }


  async _assertOptionsAsync(options) {

  }

  @trace
  async _mainAsync() {
  }

}
