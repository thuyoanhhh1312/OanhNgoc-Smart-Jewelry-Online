# Tài liệu triển khai hệ thống OanhNgoc Jewelry Online lên Google Cloud VM

## 1. Tổng quan kiến trúc

Hệ thống triển khai trên 1 máy ảo (VM) Google Cloud với các thành phần chính:

- **Backend (Server)**: Node.js (Express, MySQL)
- **Frontend (Client)**: ReactJS (Vite build, serve static qua Nginx)
- **Cơ sở dữ liệu (Database)**: MySQL chạy trong Docker container
- **NLP Service**: Python (FastAPI + PhoBERT), port 8000
- **Reverse proxy & static hosting**: Nginx
- **Domain**: `oanhngocjewelry.online` (mua từ Tenten, trỏ về VM GCP)
- **CI/CD**: GitHub Actions + SSH vào VM chạy script `deploy.sh`

Toàn bộ source code gom trong 1 repo:  
`~/OanhNgoc-Smart-Jewelry-Online` trên VM với cấu trúc:

- `server/`  → backend Node.js
- `client/`  → frontend ReactJS
- `nlp-service/` → dịch vụ PhoBERT
- `deploy.sh` → script deploy tự động cho CI/CD

---

## 2. Chuẩn bị tài khoản & project Google Cloud

1. Đăng ký tài khoản Google Cloud, kích hoạt free trial 300$.
2. Chuyển giao diện về **English** cho dễ đối chiếu tài liệu.
3. Tạo **Project mới** dùng riêng cho đồ án (VD: `oanhngocjewelry-project`).
4. Chọn khu vực gần Việt Nam (vd: `asia-southeast1` – Singapore).

---

## 3. Tạo VM (Compute Engine)

1. Vào **Compute Engine → VM instances → Create instance**.
2. Cấu hình VM:
   - Name: `oanhngocjewelry-vm`
   - Region: `asia-southeast1`
   - Machine type: `e2-medium` (2 vCPU, 4 GB RAM) đủ cho demo.
3. Boot disk:
   - Click **Change**
   - Image: **Ubuntu 22.04 LTS**
   - Disk size: 30–50 GB
4. Firewall:
   - Tick **Allow HTTP traffic**
   - Tick **Allow HTTPS traffic**
5. Networking (cơ bản giữ nguyên), đảm bảo có **External IP** (IPv4 tĩnh hoặc ephemeral).
6. Create VM.

Sau khi tạo xong, ghi lại **External IP** của VM (vd: `34.177.101.124`).

---

## 4. Cài đặt cơ bản trên VM

Kết nối SSH vào VM:

```bash
ssh <user>@<EXTERNAL_IP>
```

Trên VM, cập nhật và cài đặt các gói cần thiết:

```bash
sudo apt update && sudo apt upgrade -y

# Git, Node (qua nvm hoặc apt), build tools
sudo apt install -y git curl build-essential

# Nginx
sudo apt install -y nginx

# Docker & Docker Compose
sudo apt install -y docker.io docker-compose

# PM2 toàn cục
sudo npm install -g pm2

# Python + venv cho NLP
sudo apt install -y python3 python3-venv python3-pip
```

Clone project:

```bash
cd ~
git clone https://github.com/<your-username>/OanhNgoc-Smart-Jewelry-Online.git
```

---

## 5. Cấu hình MySQL trong Docker

### 5.1. Chạy container MySQL

Tạo container MySQL (ví dụ):

```bash
sudo docker run -d   --name ojewelry-mysql   -e MYSQL_ROOT_PASSWORD=Admin123456!   -e MYSQL_DATABASE=ecommerce   -p 3306:3306   mysql:8.0
```

### 5.2. Import dữ liệu từ local

1. Trên máy local, dùng **MySQL Workbench**:
   - Chuẩn kết nối tới DB local
   - Vào **Server → Data Export**
   - Export schema `ecommerce` ra file `.sql` (dump).

2. Upload file `.sql` lên VM (qua SCP hoặc giao diện upload trong SSH-in-browser).

3. Import vào container MySQL trên VM:

```bash
sudo docker exec -i ojewelry-mysql   mysql -u root -pAdmin123456! ecommerce < /path/to/dump.sql
```

Kiểm tra:

```bash
sudo docker exec -it ojewelry-mysql   mysql -u root -pAdmin123456! ecommerce

SHOW TABLES;
```

---

## 6. Triển khai backend (Node.js server)

### 6.1. Tạo file `.env` cho server

Trong thư mục `server` trên VM:

```bash
cd ~/OanhNgoc-Smart-Jewelry-Online/server
nano .env
```

Ví dụ nội dung:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Admin123456!
DB_NAME=ecommerce
PORT=3001

JWT_SECRET_KEY=...
JWT_REFRESH_SECRET_KEY=...
JWT_RESET_PASSWORD_SECRET_KEY=...

# VNPAY sandbox
VNP_TMN_CODE=...
VNP_HASHSECRET=...
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=https://oanhngocjewelry.online/api/payment/vnpay_return

# Client URL
CLIENT_URL=https://oanhngocjewelry.online

# NLP Service (Internal)
NLP_SERVICE_URL=http://127.0.0.1:8000
```

### 6.2. Cài dependency & start bằng PM2

```bash
cd ~/OanhNgoc-Smart-Jewelry-Online/server
npm install

# Start server với pm2
pm2 start npm --name "jewelry-server" -- run dev

# Hoặc nếu có script start build riêng
# pm2 start npm --name "jewelry-server" -- start

pm2 save  # lưu cấu hình pm2 để reboot tự lên
```

Kiểm tra backend:

```bash
curl http://127.0.0.1:3001/api/health
```

---

## 7. Triển khai frontend (ReactJS + Vite)

### 7.1. Cấu hình environment cho client

Trong thư mục `client`:

```bash
cd ~/OanhNgoc-Smart-Jewelry-Online/client
nano .env.production
```

Ví dụ nội dung:

```env
VITE_API_URL=https://oanhngocjewelry.online/api
VITE_VNP_RETURN_URL=https://oanhngocjewelry.online/api/payment/vnpay_return
```

### 7.2. Build và copy static sang Nginx web root

```bash
cd ~/OanhNgoc-Smart-Jewelry-Online/client
npm install
npm run build
```

Tạo web root cho Nginx và copy file:

```bash
sudo mkdir -p /var/www/oanhngocjewelry.online
sudo rm -rf /var/www/oanhngocjewelry.online/*
sudo cp -r dist/* /var/www/oanhngocjewelry.online/
sudo chown -R www-data:www-data /var/www/oanhngocjewelry.online
```

---

## 8. Cấu hình Nginx + domain

### 8.1. Trỏ domain trên Tenten về VM

1. Vào trang quản lý domain tại Tenten.
2. Thêm bản ghi DNS:
   - Type: `A`
   - Host: `@` (hoặc để trống tùy giao diện)
   - Value: `34.177.101.124` (External IP VM)
   - TTL: 600 hoặc mặc định.
3. Có thể thêm bản ghi `www` → IP VM.

Chờ DNS propagate (thường vài phút đến vài chục phút).

### 8.2. Cấu hình Nginx site

Tạo file cấu hình:

```bash
sudo nano /etc/nginx/sites-available/oanhngocjewelry.online
```

Ví dụ nội dung:

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name oanhngocjewelry.online www.oanhngocjewelry.online;

    # Frontend (React build)
    root /var/www/oanhngocjewelry.online;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API NodeJS
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # NLP service (PhoBERT)
    location /nlp/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # OpenAPI JSON cho Swagger (FastAPI)
    location = /openapi.json {
        proxy_pass http://127.0.0.1:8000/openapi.json;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Kích hoạt site và reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/oanhngocjewelry.online /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Kiểm tra:

- Frontend: `http://oanhngocjewelry.online`
- API: `http://oanhngocjewelry.online/api/...`
- NLP docs: `http://oanhngocjewelry.online/nlp/docs`

---

## 9. Triển khai NLP-service (PhoBERT)

### 9.1. Cài môi trường và dependency

```bash
cd ~/OanhNgoc-Smart-Jewelry-Online/nlp-service

python3 -m venv venv
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

Tùy repo, service chính nằm trong file `sentiment_api.py` với FastAPI:

```bash
uvicorn sentiment_api:app --host 0.0.0.0 --port 8000
```

Test nội bộ:

```bash
curl http://127.0.0.1:8000/docs
```

### 9.2. Chạy NLP service bằng PM2

```bash
cd ~/OanhNgoc-Smart-Jewelry-Online/nlp-service
source venv/bin/activate

pm2 start "venv/bin/uvicorn sentiment_api:app --host 0.0.0.0 --port 8000" --name phobert-service
pm2 save
```

Từ phía backend Node, gọi nội bộ:

```js
const NLP_URL = process.env.NLP_SERVICE_URL || "http://127.0.0.1:8000";

const resp = await axios.post(`${NLP_URL}/sentiment`, { text: content });
```

---

## 10. Thiết lập CI/CD với GitHub Actions

### 10.1. Tạo SSH key riêng cho CI

Trên local:

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions@oanhngoc" -f github-actions-gcp
```

- `github-actions-gcp` → private key
- `github-actions-gcp.pub` → public key

Add public key vào VM (file `~/.ssh/authorized_keys`).  
Private key copy lên GitHub Secrets.

### 10.2. Script deploy trên VM – `deploy.sh`

Trong thư mục project trên VM:

```bash
cd ~/OanhNgoc-Smart-Jewelry-Online
nano deploy.sh
```

Ví dụ nội dung tối giản cho CI:

```bash
#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$HOME/OanhNgoc-Smart-Jewelry-Online"
WEB_ROOT="/var/www/oanhngocjewelry.online"
PM2_APP_NAME="jewelry-server"

echo ">>> CI: Go to project folder"
cd "$PROJECT_DIR"

echo ">>> CI: Pull latest code (origin/main)"
git fetch origin main
git reset --hard origin/main

echo ">>> CI: Install server deps (production)"
cd server
npm ci --only=production 2>/dev/null || npm install --production

echo ">>> CI: Restart backend with pm2"
if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_APP_NAME"
else
  pm2 start npm --name "$PM2_APP_NAME" -- run dev
fi

echo ">>> CI: Build client"
cd ../client
npm ci 2>/dev/null || npm install
npm run build

echo ">>> CI: Deploy client static files to Nginx web root"
rm -rf "${WEB_ROOT:?}"/*
cp -r dist/* "$WEB_ROOT"/

echo ">>> CI: Reload Nginx (non-interactive)"
if sudo -n systemctl reload nginx 2>/dev/null; then
  echo ">>> CI: Nginx reloaded successfully"
else
  echo ">>> CI WARNING: Cannot reload Nginx (sudo needs password)."
  echo ">>> CI WARNING: Please run manually on VM: sudo systemctl reload nginx"
fi

echo ">>> CI: Deploy done!"
```

Phân quyền thực thi:

```bash
chmod +x deploy.sh
```

### 10.3. GitHub Actions workflow

Tạo file `.github/workflows/deploy.yml` trong repo:

```yaml
name: Deploy to GCP VM

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout source
        uses: actions/checkout@v4

      - name: Test build server & client (optional)
        run: |
          cd server
          npm install
          npm run lint || echo "No lint script"
          cd ../client
          npm install
          npm run build

      - name: Deploy to GCP VM via SSH
        uses: appleboy/ssh-action@v1.1.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ~/OanhNgoc-Smart-Jewelry-Online
            ./deploy.sh
```

Secrets cần thiết trong GitHub repo:

- `SSH_HOST`  → IP hoặc domain của VM (`34.177.101.124` hoặc `oanhngocjewelry.online`)
- `SSH_USER`  → user SSH (vd: `thuyoanhhh1312`)
- `SSH_PRIVATE_KEY` → nội dung private key sinh cho CI

Sau khi cấu hình xong:

- Mỗi lần `git push` lên nhánh `main` → GitHub Actions tự build & deploy lên VM.

---

## 11. Kiểm thử & vận hành

### 11.1. Kiểm tra dịch vụ trên VM

```bash
# Xem các tiến trình pm2
pm2 status

# Log backend
pm2 logs jewelry-server

# Log NLP
pm2 logs phobert-service

# Log Nginx
sudo tail -f /var/log/nginx/error.log
```

### 11.2. Các URL kiểm thử chính

- Web: `http://oanhngocjewelry.online`
- API health (nếu có): `http://oanhngocjewelry.online/api/health`
- NLP Swagger: `http://oanhngocjewelry.online/nlp/docs`
- VNPAY return URL (sandbox):  
  `https://oanhngocjewelry.online/api/payment/vnpay_return`

---

## 12. Ghi chú & best practices cho báo cáo đồ án

- Nêu rõ lựa chọn **Google Cloud VM** vì:
  - Kiểm soát toàn bộ stack (Node, Python, MySQL, Nginx, Docker) trên 1 máy.
  - Phù hợp demo, chủ động cấu hình CI/CD.
- Lý do dùng **Nginx**:
  - Reverse proxy cho API và NLP-service.
  - Serve static file cho React build.
  - Dễ cấu hình HTTPS sau này (Let's Encrypt).
- Dùng **PM2** để:
  - Quản lý process Node và uvicorn (PhoBERT).
  - Tự động khởi động lại khi crash, hỗ trợ log.
- Quy trình chuẩn khi có thay đổi:
  1. Code → Commit → Push nhánh feature.
  2. Merge vào `main`.
  3. GitHub Actions chạy CI/CD → auto deploy.
  4. Kiểm tra trên domain thật.