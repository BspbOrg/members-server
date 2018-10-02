module.exports = class SequenceGenerator {
  constructor ({ model }) {
    this.model = model
  }

  async generateId () {
    const { id } = await this.model.create({})
    return id
  }
}
