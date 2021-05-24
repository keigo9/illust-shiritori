1: skaffold dev
this command incloud 'docker build(npm install)' 'npm start(nodemon src/app.js)' 'kubectl apply -f'
you can make local environment easy and quick.

https://www.docker.com/
https://nodejs.org/ja/docs/guides/nodejs-docker-webapp/
https://kubernetes.io/ja/docs/reference/kubectl/overview/
https://skaffold.dev/

2: open code /etc/host , add the follwing
"127.0.0.1 ~.dev"
this is host name , in k8s/ingress-srv.yaml
ex "127.0.0.1 shiritori.dev"

https://kubernetes.github.io/ingress-nginx/deploy/

3: access to local server in your browser
It says that the site cannot be accessed due to security issues.
to solve it , you get a certificate.
after that you enter 'thisisunsafe' in browser.
maybe you can access localhost!
