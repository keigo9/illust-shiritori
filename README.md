local development
1: skaffold dev
this command incloud 'docker build(npm install)' 'npm start(nodemon src/app.js)' 'kubectl apply -f'
you can make local environment easy and quick.

https://www.docker.com/
https://nodejs.org/ja/docs/guides/nodejs-docker-webapp/
https://kubernetes.io/ja/docs/reference/kubectl/overview/
https://skaffold.dev/

2: open code /etc/hosts , add the follwing
"127.0.0.1 ~.dev"
this is host name , in k8s/ingress-srv.yaml
ex "127.0.0.1 shiritori.dev"

https://kubernetes.github.io/ingress-nginx/deploy/

3: access to local server in your browser 'shiritori.dev'
It says that the site cannot be accessed due to security issues.
to solve it , you get a certificate.
after that you enter 'thisisunsafe' in browser.
maybe you can access localhost!

deploy to heorku
1: change URL in main.js and serever.js to solve cors problem.

2: make 'heroku.yuml' in your root project.
to deploy docker image.
ex: https://devcenter.heroku.com/ja/articles/build-docker-images-heroku-yml

3: heroku crate
git rmeote -v
heroku https:~ (featch)
heorku https:~ (push)
is ready!
https://devcenter.heroku.com/articles/getting-started-with-nodejs#deploy-the-app

5: heroku stack:set container
change stack to deploy docker image.

https://devcenter.heroku.com/ja/articles/stack

4: git add .
git commit -m '~'
git push heroku main
