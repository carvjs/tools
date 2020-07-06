import { gql } from '@carv/runtime'

export const fetchMe = gql`
  query FetchMe {
    me {
      id
      firstName
      lastName
    }
  }
`
