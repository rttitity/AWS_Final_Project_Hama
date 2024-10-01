FROM nginx

WORKDIR /etc/nginx/conf.d/
ADD ./default.conf .

WORKDIR /var/www/html/AWS_FinalProject
ADD . .