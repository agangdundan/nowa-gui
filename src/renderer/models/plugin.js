import { lt } from 'semver';
import { join } from 'path';
import { remote } from 'electron';

import i18n from 'i18n-renderer-nowa';
import { request, delay } from 'shared-nowa';
import { msgError } from 'util-renderer-nowa';
import { REGISTRY_MAP } from 'const-renderer-nowa';
import { getLocalPlugins, setLocalPlugins } from 'store-renderer-nowa';

const { commands, paths } = remote.getGlobal('services');
const target = name => join(paths.NODE_MODULES_PATH, name, 'plugin.js');


async function checkPluginLatest(item, registry) {
  const { err, data } = await request(`${registry}/${item.name}/latest`);
  if (!err) {
    item.newest = data.version;
    if (item.installed) {
      item.needUpdate = lt(item.version, data.version);
    } else {
      item.version = 'null';
    }
  } else {
    item.needUpdate = false;
    item.newest = 'null';
    item.version = item.version || 'null';
  }

  return item;
}

export default {
  namespace: 'plugin',

  state: {
    pluginList: [],
    UIPluginList: [],
    loading: false,
  },

  subscriptions: {
    setup({ dispatch }) {
      const pluginList = getLocalPlugins();

      dispatch({
        type: 'changeStatus',
        payload: {
          pluginList,
          // uiPluginList: pluginList.filter(item => item.type === 'ui')
        },
      });
      dispatch({
        type: 'initUIPluginList'
      });
    },
  },

  effects: {
    * fetch(o, { put, select }) {
      console.log('fetch plugins');
      const { atAli } = yield select(state => state.layout);
      const { registry } = yield select(state => state.setting);
      const { pluginList } = yield select(state => state.plugin);

      const { data } = yield request(`${registry}/nowa-gui-plugins-test/latest`);
      let npmPluginList = data.plugins;

      if (!atAli) {
        npmPluginList = npmPluginList.filter(item => item.origin === 'common');
      }

      const newList = npmPluginList.map((item) => {
        const filter = pluginList.filter(n => n.name === item.name);
        if (filter.length > 0) {
          return filter[0];
        }

        return {
          ...item,
          installed: false,
          apply: false,
          needUpdate: false,
        };
      });

      const filter = pluginList.filter(
        item => !npmPluginList.some(n => n.name === item.name)
      );

      const npm = atAli ? REGISTRY_MAP.tnpm : registry;

      const res = yield Promise.all(
        newList.concat(filter).map(item => checkPluginLatest(item, npm))
      );

      yield put({
        type: 'changeStatus',
        payload: { pluginList: res, loading: false },
      });
    },
    * install({ payload }, { put, select }) {
      console.log('installPlugin', payload);
      const { atAli } = yield select(state => state.layout);
      const { registry } = yield select(state => state.setting);

      yield put({
        type: 'changeStatus',
        payload: { loading: true },
      });

      const opt = {
        root: paths.NOWA_INSTALL_DIR,
        pkgs: [{
          name: payload.name,
          version: payload.newest === 'null' ? 'latest' : payload.newest
        }],
        registry: atAli ? REGISTRY_MAP.tnpm : registry,
      };

      const { err } = yield commands.install({ opt });

      if (err) {
        msgError(i18n('msg.installFail'));
        yield put({
          type: 'changeStatus',
          payload: { loading: false },
        });
      } else {
        payload.version = payload.newest;
        payload.installed = true;

        const storePlugin = getLocalPlugins();

        storePlugin.push(payload);
        setLocalPlugins(storePlugin);


        yield put({
          type: 'changePluginList',
          payload,
        });

        if (payload.type === 'ui') {
          const newItem = {
            name: payload.name,
            file: remote.require(target(payload.name))
          };
          const { UIPluginList } = yield select(state => state.plugin);
          UIPluginList.push(newItem);
          yield put({
            type: 'changeStatus',
            payload: { UIPluginList: [...UIPluginList] }
          });
        }
      }
    },
    * reinstall({ payload }, { put }) {
      console.log('reinstallPlugin', payload);
      const opt = {
        root: paths.NOWA_INSTALL_DIR,
        pkgs: [{ name: payload.name, version: payload.version }]
      };

      yield commands.uninstall(opt);
      yield delay(1000);
      yield put({
        type: 'install',
        payload
      });
    },
    * update({ payload }, { put }) {
      console.log('updateplugin', payload);

      payload.version = payload.newest;
      payload.needUpdate = false;

      yield put({
        type: 'changePluginList',
        payload,
      });

      const storePlugin = getLocalPlugins();
      setLocalPlugins(
        storePlugin.map(item => (item.name === payload.name ? payload : item))
      );
    },
    * apply({ payload: { record, checked } }, { put }) {
      console.log('applyPlugin', record);

      record.apply = checked;

      yield put({
        type: 'changePluginList',
        payload: record,
      });

      const storePlugin = getLocalPlugins();

      setLocalPlugins(
        storePlugin.map(item => (item.name === record.name ? record : item))
      );
    },
    * changePluginList({ payload }, { put, select }) {
      const { pluginList } = yield select(state => state.plugin);
      const newList = pluginList.map((item) => {
        if (item.name === payload.name) {
          return payload;
        }
        return item;
      });
      yield put({
        type: 'changeStatus',
        payload: { pluginList: [...newList], loading: false },
      });
    },
    * initUIPluginList(o, { put, select }) {
      const pluginList = getLocalPlugins().filter(item => item.type === 'ui');

      const UIPluginList = pluginList.map(({ name }) => ({
          name,
          file: remote.require(target(name))
        })
      );
      yield put({
        type: 'changeStatus',
        payload: { UIPluginList }
      });
    }
  },
  reducers: {
    changeStatus(state, action) {
      return { ...state, ...action.payload };
    },
  },
};