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
    screenshot: "demo_input.jpeg",
    result: "output_demo.png",
  },
}
