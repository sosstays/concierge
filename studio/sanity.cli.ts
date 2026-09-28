import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '4xk58dqh',
    dataset: 'production'
  },
  deployment: {
    /**
     * Auto-updates disabled: sanity@6.10.1+ pulls in @sanity/sdk-react@2.20.0,
     * which ships unparsed JSX in a .js file and breaks the build/dev/schema-deploy
     * pipeline. Pinned to 6.9.0 (last version without that dependency) until
     * Sanity ships a fix upstream. Re-enable once that's resolved.
     */
    autoUpdates: false,
    appId: 'b3mcomgtxyrc8awaazm32jkv',
  },
})
