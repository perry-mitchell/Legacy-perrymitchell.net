# PerryMitchell.net
My personal website

## About
My website uses a custom build procedure to generate a **static blog** from markdown files and SCSS. The files use some kind of _front matter_ (term borrowed from Jekyll) to list properties (like title etc.).

My blog has had a long history - originally Wordpress, then migrated to Hexo. I even tried building it again inside of Jekyll. There is legacy data in the front matter properties as well as a huge `wp-content` directory left over from Wordpress (full of images).

## Building
You can start playing with the blog locally by running `npm run start` - This will build the blog and then serve it locally on port 4000.

You can build for production by running `npm run build`, or for development by running `ENVIRONMENT=development npm run build`.

## Deploying
Obviously you won't have rights to deploy to my server, but normally `npm run deploy` would do so. It uses flightplan to manage the deployment.

## Rights
All written and photographic content is Copyright and should not be redistributed. The code that creates the blog, however, is MIT licensed so go crazy!
