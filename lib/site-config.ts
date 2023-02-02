interface SiteConfig {
  name: string
  description: string
  links: {
    twitter: string
  }
  demoImages: {
    screenshot: string
    result: string
  }
}

export const siteConfig: SiteConfig = {
  name: "Companion",
  description: "A companion app for Madden's franchise mode.",
  links: {
    twitter: "https://twitter.com/richardpoelderl",
  },
  demoImages: {
    screenshot:
      "https://storage.googleapis.com/madden-regression-bucket/demo_input.jpeg",
    result:
      "https://storage.googleapis.com/madden-regression-bucket/output_demo.png",
  },
}
