const { Initializer, api } = require('actionhero')
const formatDate = require('date-fns/format')
const csvStringify = require('csv-stringify/lib/sync')

module.exports = class OutputFormatInitializer extends Initializer {
  constructor () {
    super()
    this.name = 'outputFormat'
  }

  async initialize () {
    api.actions.addMiddleware({
      name: 'outputFormat',
      global: false,
      preProcessor: ({ actionTemplate: { exportName, inputs } }) => {
        if (!inputs.outputType) {
          inputs.outputType = {
            default: (value, { connection: { extension } }) => value || extension || 'json',
            validator: (value) => ['csv', 'json'].includes(value)
          }
        }
        if (!inputs.outputFilename) {
          inputs.outputFilename = {}
        }
      },
      postProcessor: async (
        {
          actionTemplate: { exportName },
          params,
          response: { data, count, error },
          connection,
          toRender
        }) => {
        if (error) return
        const { outputType, outputFilename } = params
        if (outputType === 'json') return
        const { rawConnection: { responseHeaders } } = connection
        switch (outputType) {
          case 'csv':
            const filename = outputFilename || `${exportName}-${formatDate(Date.now())}.${outputType}`
            responseHeaders.push(['content-type', 'text/csv; charset=utf-8'])
            responseHeaders.push(['content-disposition', `attachment; filename="${filename}"`])
            toRender = false
            // start with BOM to clue ms excel that the file is utf8 encoded
            connection.sendMessage('\ufeff' + csvStringify(data, {
              delimiter: ';',
              header: true,
              quotedString: true,
              formatters: {
                date: value => formatDate(value, 'YYYY-MM-DD')
              }
            }))
            break
        }
      }
    })
  }
}
