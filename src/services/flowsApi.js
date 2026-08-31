import api from './api'

const baseUrl = 'http://localhost:3032'

const flowsAPI = {
  async list(params) {
    const { data } = await api.get(
      `${ baseUrl }/flows`,
      { params }
    )
    return data
  },

  async get(flowId) {
    const { data } = await api.get(
      `${ baseUrl }/flows/${ flowId }`
    )
    return data
  },

  async create(payload) {
    const { data } = await api.post(
      `${ baseUrl }/flows`,
      payload
    )
    return data
  },

  async update(flowId, changes) {
    const { data } = await api.put(
      `${ baseUrl }/flows/${ flowId }`,
      changes
    )
    return data
  },

  async remove(flowId) {
    const { data } = await api.delete(
      `${ baseUrl }/flows/${ flowId }`
    )
    return data
  },

  async duplicate(flowId) {
    const { data } = await api.post(
      `${ baseUrl }/flows/${ flowId }/duplicate`
    )
    return data
  }
}

export default flowsAPI