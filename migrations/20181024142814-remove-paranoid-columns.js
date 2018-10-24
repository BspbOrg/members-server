'use strict'

module.exports = {
  up: async (queryInterface, { Op }) => {
    await queryInterface.bulkDelete('members', { deletedAt: { [Op.ne]: null } })
    await queryInterface.bulkDelete('payments', { deletedAt: { [Op.ne]: null } })
    await queryInterface.bulkDelete('users', { deletedAt: { [Op.ne]: null } })
    if (queryInterface.sequelize.options.dialect !== 'sqlite') {
      await queryInterface.removeColumn('members', 'deletedAt')
      await queryInterface.removeColumn('payments', 'deletedAt')
      await queryInterface.removeColumn('users', 'deletedAt')
    }
  },

  down: async (queryInterface, DataTypes) => {
    if (queryInterface.sequelize.options.dialect !== 'sqlite') {
      await queryInterface.addColumn('members', 'deletedAt', DataTypes.DATE)
      await queryInterface.addColumn('payments', 'deletedAt', DataTypes.DATE)
      await queryInterface.addColumn('users', 'deletedAt', DataTypes.DATE)
    }
  }
}
