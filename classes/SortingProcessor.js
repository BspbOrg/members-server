module.exports = class SortingProcessor {
  generateSortingQuery ({ sortingColumns, asc = true, defaultValue = [] }) {
    if (sortingColumns && sortingColumns.length > 0) {
      return sortingColumns.map(column => ([column, asc ? 'ASC' : 'DESC']))
    } else {
      return defaultValue
    }
  }
}
