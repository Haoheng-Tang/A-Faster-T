export interface Item {
  id: string
  type: 'bus' | 'train' | 'other'
  label: string
  lat?: number
  lon?: number
}

export async function mockFetchData(options?: { live?: boolean }): Promise<Item[]> {
  await new Promise((r) => setTimeout(r, 300))
  const sample: Item[] = [
    { id: 'b1', type: 'bus', label: 'Bus 1', lat: 42.3521, lon: -71.0552 },
    { id: 'b2', type: 'bus', label: 'Bus 24', lat: 42.3550, lon: -71.0600 },
    { id: 't1', type: 'train', label: 'Red Line', lat: 42.3656, lon: -71.1038 },
  ]

  if (options?.live) {
    return sample.map((s) => ({ ...s, lat: s.lat! + Math.random() * 0.001, lon: s.lon! + Math.random() * 0.001 }))
  }

  return sample
}

export const adapters = {
  openStreetMap: {
    async fetchData(): Promise<Item[]> {
      return []
    },
  },
  unrealVM: {
    async fetchData(): Promise<Item[]> {
      return []
    },
  },
}

export default mockFetchData

export const adapterKeys = Object.keys(adapters) as Array<keyof typeof adapters>

export async function fetchFromAdapter(adapterKey: string, options?: any): Promise<Item[]> {
  if (adapterKey === 'mock' || !adapterKey) {
    return mockFetchData(options)
  }

  const adapter = (adapters as any)[adapterKey]
  if (!adapter || typeof adapter.fetchData !== 'function') {
    return []
  }

  return adapter.fetchData(options)
}
