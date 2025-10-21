'use client'
import { createContext, useContext } from 'react'
import { useDataSync } from '@/hooks/useDataSync'

const DataSyncContext = createContext({})

export const useDataSyncContext = () => {
  const context = useContext(DataSyncContext)
  if (!context) {
    throw new Error('useDataSyncContext must be used within a DataSyncProvider')
  }
  return context
}

export const DataSyncProvider = ({ children }) => {
  const dataSync = useDataSync()

  return (
    <DataSyncContext.Provider value={dataSync}>
      {children}
    </DataSyncContext.Provider>
  )
}
