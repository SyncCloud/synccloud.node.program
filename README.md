# @synccloud/program

## main()
```js
import YourProgram from 'src/program';
import {main} from '@synccloud/program';

main(YourProgram);
```
## class Program
```js
import _ from 'lodash';
import {trace} from '@synccloud/logging';
import {assertType} from '@synccloud/utils';
import {AmqpService} from '@synccloud/amqp';
import {Program} from '@synccloud/program';

export default class GmailProgram extends Program {

  static async createAppAsync() {
    const app = new GmailProgram();
    await app._setupAsync();
    return app;
  }

  @trace
  async _setupAsync() {
    await Program.prototype._setupAsync.call(this);
    this.service = new AmqpService(this.options.amqp);
    await this.service.buildAsync(_.omit(this.options, 'amqp'));
  }

  @trace
  async _assertOptionsAsync(options) {
    await Program.prototype._assertOptionsAsync.call(this, options);

    assertType(options.amqp, 'object', 'options.amqp');
    assertType(options.amqp.uri, 'string', 'options.amqp.uri');
  }

  @trace
  async _mainAsync() {
    await this.service.runAsync(this.cancellation);
  }
}
```
