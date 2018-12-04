docker build -t diode/multi-client:latest -t diode/multi-client:$SHA -f ./client/Dockerfile ./client
docker build -t diode/multi-server -t diode/multi-server:$SHA -f ./server/Dockerfile ./server
docker build -t diode/multi-worker -t diode/multi-worker:$SHA -f ./worker/Dockerfile ./worker

docker push diode/multi-client:latest
docker push diode/multi-server:latest
docker push diode/multi-worker:latest

docker push diode/multi-client:$SHA
docker push diode/multi-server:$SHA
docker push diode/multi-worker:$SHA

kubectl apply -f k8s
kubectl set image deployments/server-deployment server=diode/multi-server:$SHA
kubectl set image deployments/client-deployment client=diode/multi-client:$SHA
kubectl set image deployments/worker-deployment worker=diode/multi-worker:$SHA

