import axios from 'axios'
import { AxiosInstance, AxiosPromise, AxiosRequestConfig } from 'axios';
import { getToken } from './root'

let apiClient: AxiosInstance;

export const API = {
  get(url: string, config?: AxiosRequestConfig) {
    return getAPIClient().get(url, config)
  },
  put(url: string, data?: any, config?: AxiosRequestConfig) {
    return getAPIClient().put(url, data, config)
  },
  patch(url: string, data?: any, config?: AxiosRequestConfig) {
    return getAPIClient().patch(url, data, config)
  },
  post(url: string, data?: any, config?: AxiosRequestConfig) {
    return getAPIClient().post(url, data, config)
  },
}

function getAPIClient() {
  if (apiClient)
    return apiClient

  const baseURL = process.env.FLY_BASE_URL || "https://fly.io"

  apiClient = axios.create({
    baseURL: baseURL,
    timeout: 5000,
    headers: { "Authorization": `Bearer ${getToken()}` }
  })

  return apiClient
}