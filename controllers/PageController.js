const PageController = {
  home: () => new Response("Welcome to the Home Page!"),
  about: () => new Response("This is the About Page!"),
  contact: () => new Response("Contact us at"),
  user: (params) => new Response(`User ID: ${params.id}`),
  userProfile: (params) => new Response(`User Profile name: ${params.id}`),
  notFound: () => new Response("404 - Page Not Found!", { status: 404 })
};

export default PageController;
