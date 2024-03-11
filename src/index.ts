import { Options } from '../types'
import Connector from './connector'

export function createConnector(opts: Options) {
    return new Connector(opts)
}
