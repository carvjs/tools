import { gql } from '@carv/runtime'

export type { FetchMe, FetchMeVariables } from './__generated__/fetch-me'

export const fetchMe = gql`
  query FetchMe {
    me {
      id
      firstName
      lastName
    }
  }
`
