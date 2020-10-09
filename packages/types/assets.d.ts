// Asset module declarations
// keep in sync with jest-preset

declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}

declare module '*.module.scss' {
  const classes: Record<string, string>
  export default classes
}

declare module '*.module.less' {
  const classes: Record<string, string>
  export default classes
}

declare module '*.css' {
  // No exports
}

declare module '*.scss' {
  // No exports
}

declare module '*.less' {
  // No exports
}

declare module '*.jpg' {
  const url: string
  export default url
}

declare module '*.jpeg' {
  const url: string
  export default url
}

declare module '*.png' {
  const url: string
  export default url
}

declare module '*.gif' {
  const url: string
  export default url
}

declare module '*.ico' {
  const url: string
  export default url
}

declare module '*.eot' {
  const url: string
  export default url
}

declare module '*.otf' {
  const url: string
  export default url
}

declare module '*.webp' {
  const url: string
  export default url
}

declare module '*.svg' {
  const url: string
  export default url
}

declare module '*.ttf' {
  const url: string
  export default url
}

declare module '*.woff' {
  const url: string
  export default url
}

declare module '*.woff2' {
  const url: string
  export default url
}

declare module '*.mp4' {
  const url: string
  export default url
}

declare module '*.webm' {
  const url: string
  export default url
}

declare module '*.wav' {
  const url: string
  export default url
}

declare module '*.mp3' {
  const url: string
  export default url
}

declare module '*.mp4a' {
  const url: string
  export default url
}

declare module '*.aac' {
  const url: string
  export default url
}

declare module '*.oga' {
  const url: string
  export default url
}
