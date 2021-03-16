# Skaffold with `A simple express app`

## BE lazy! Why?

Because there is a lot more important thing to do than setting up localhost or dealing with local/server difference.

---

## How?

## Prerequisite

### - A working kubernetes cluster

You have many options to create your own cluster (free/not free)
For tech savvy, you can go with aws eks/ google gks but for lazy people:

1. minikube: a light kubernetes you can install and run on local machine
   https://minikube.sigs.k8s.io/docs/start/
2. Rancher signle node solution: with single command, you can get rancher together with a cluster up running locally in minutes
   https://rancher.com/docs/rancher/v2.x/en/installation/other-installation-methods/single-node-docker/

### - Congfig your .kube/config to allow api request to your kubenetes cluster/namespace

You can find how to do this in previous step depneds on different provider

### - Install kubectl locally

https://kubernetes.io/docs/tasks/tools/

### - Install docker locally

https://docs.docker.com/get-docker/

### - Create or get access to a docker registry

https://hub.docker.com/_/registry

### - Install skaffold and kustomization

https://skaffold.dev/docs/install/
https://kubectl.docs.kubernetes.io/installation/kustomize/

---

### - set up your docker image tag in

skaffold.yaml
k8s/develop.yaml

## Once you have a cluster and all pieces installed, you can run this command under project root:

`skaffold dev`

You can find out where the app is running by run
`kubectl get svc` to grab the IP or use the host if you create an ingress.

### If you really want localhost, you can do port forwarding like

`skaffold dev --port-forward`

### Important feature every developer needs, debugging.

`skaffold debug --port-forward`

The deugger port is by default 9229, I added the config for vs code in .vscode. Every IDE would need some additional set up for debugging.

---

## If you want to start from scratch and understand how everything work together, continue below.

Open terminal, create a new directory and initiate a new express app
`npx express-generator`
A sample express app should be created

There are two options you can get your app running.

Traditionally, you can do :

`npm install` and `npm start`. The app should be listening on port 3000 by default, but I would show you an alternative way.

1. Add a `Dockerfile` to instruct the container builder how to construct your container, the file should have been included in this dir

```FROM node:14

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]
```

2. Add a `.dockerignore` file to ignore unwanted files. This is important so that Skaffold knows what files it may ignore:

   ```
    .git
    .idea
    node_modules
   ```

3. Add a skaffold.yaml file

   ```
    apiVersion: skaffold/v1beta13
    kind: Config
    metadata:
    name: skaffold-demo-app
    build:
    artifacts:
        - image: xujiyuan/images (replace this with your docker hub address)
        sync:
            infer:
            - "**/*.js"
            - "**/*.html"
            - "**/*.css"
        docker:
            dockerfile: Dockerfile
    local:
        push: true
    deploy:
    kustomize:
        path: k8s
   ```

4. Add kubernetes menifest files, these files will instruct how and what to be deployed to the cluster.

#### A. k8s/deploy.yaml: Create a pod and deploy it to the kubernetes cluster with given name and expose the pod on port 3000 (this should be the same your app is listening on)

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-app
spec:
  selector:
    matchLabels:
      app: demo-app
  template:
    metadata:
      labels:
        app: demo-app
    spec:
      containers:
        - name: demo-app
          image: xujiyuan/images:0.1.1 (tag does not matter)
          ports:
            - containerPort: 3000
```

#### B. k8s/service.yaml: A service in the interface between pod and others either internal or external. In this case, we want to expose our pod to public network.

```
apiVersion: v1
kind: Service
metadata:
  name: demo-app
spec:
  selector:
    app: demo-app
  ports:
    - port: 80 (this is public port)
      targetPort: 3000 (this is the port in the pod)
  type: LoadBalancer

```

#### C. k8s/ingress.yaml: Depends on your cluster set up, this in nice but optional. Because once you have a service created, the cluster should automatically assign an external ip. In this case, we use url prefix:

```
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: demo-app
spec:
  rules:
    - host: demo.${your cluster public domain}
      http:
        paths:
          - backend:
              # The `serviceName` should match the name of the service defined
              # in the `service.yaml` file in the base.
              service:
                name: demo-app
                port:
                  number: 3000
            path: /
            pathType: Prefix
  tls:
    - hosts:
        - demo.${your cluster public domain}
```

#### D. k8s/kustomization.yaml: This is optional but handy to have, you can add environment dependent config values and manage all other kubernetes menifest files in one place.

```
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
  - ingress.yaml

```

5. Now you can run `skaffold dev`
   it will automatically do
   `build image` -> `push image` -> `deploy` -> `monitor` -> `sync logs`

---

## As developer, you should only expect to

1. install kubecl
2. config kubenetes file to include your secret
3. install skaffold and kustomization

All of these can be done in few minutes and should be done once only

---

## Resource to learn

- Kubernetes: https://www.cncf.io/certification/ckad/
- skaffold: https://skaffold.dev/
