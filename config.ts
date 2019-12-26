import devConfig from './config.dev'
import prodConfig from './config.prod'
import offlineConfig from './config.offline'

const coreConfig = process.env.STAGE === 'prod'
  ? prodConfig
  : devConfig

const config = process.env.IS_OFFLINE
  ? { ...coreConfig, ...offlineConfig }
  : coreConfig

export default config
