module.exports = class SortingProcessor {
  generateSortingQuery (
    {
      columns,
      ascending = true,
      defaultValue: {
        columns: defaultColumns = [],
        ascending: defaultAscending = true
      } = {}
    } = {}
  ) {
    let [c, a] = (columns && columns.length > 0) ? [columns, ascending] : [defaultColumns, defaultAscending]
    return c.map(column => ([column, a ? 'ASC' : 'DESC']))
  }
}
