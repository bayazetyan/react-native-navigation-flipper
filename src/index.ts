import { addPlugin, Flipper } from 'react-native-flipper';

let _connection: Flipper.FlipperConnection | null = null;
let _listeners: Record<string, any> = {};

const navigator = ['push', 'setStackRoot', 'pop', 'popTo', 'popToRoot', 'showModal', 'dismissModal', 'showOverlay', 'dismissOverlay']

export const initNavigationFlipperPlugin = (Navigation: any) => {
  if (!_connection) {
    addPlugin({
      getId() {
        return 'flipper-plugin-react-native-navigation';
      },
      onConnect(connection) {
        _connection = connection;

        _listeners.commandtListener = Navigation.events().registerCommandListener((name: string, params: any) => {
          if (name === 'setDefaultOptions') {
            _connection?.send('defaultOptions', params.options);
          } else if (name === 'setRoot') {
            _connection?.send('setRoot', params);
          } else if (navigator.includes(name)) {
            _connection?.send('navigate', { params, type: name });
          }
        })

        _listeners.popListener = Navigation.events().registerScreenPoppedListener(({ componentId }: { componentId: string }) => {
          _connection?.send('pop', { componentId });
        });


        // receivers
        _connection.receive('navigate', (params) => {
          const { type, navigationOptions, context } = params;
          Navigation?.[type]?.(context, navigationOptions)
        })

        _connection.receive('updateProps', (params) => {
          const { props, context } = params;
          Navigation.updateProps(context, props)
        })

        _connection.receive('updateOptions', (params) => {
          const { options, context } = params;
          Navigation.mergeOptions(context, options)
        })
      },
      onDisconnect() {
        _connection = null

        _listeners?.commandtListener?.remove();
        _listeners?.popListener?.remove();
      },
      runInBackground(): boolean {
        return true;
      }
    });
  }
}

