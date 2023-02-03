import { HomePage } from "./homepage"

// import { Testimonials } from "../components/testimonials"
export default async function Page() {
  // render Client Component, this is to avoid an error when passing the image loader in the client component
  return <HomePage />
}
