# Deploying Codevidhya to AWS (single EC2 box)

This runs all four apps on **one always-on EC2 server** — no cold starts, no
"sleeping" like Render's free tier. With a `t3.small` (~$15/mo) your $200 credit
lasts the full 6 months with room to spare.

```
                       Internet
                          │
            ┌─────────────┴──────────────┐
            │  EC2 (Ubuntu 24.04)         │
   :80 ───► nginx ──► portal :4000        │   ◄─ you open http://<IP>
            │           │  (proxies + auth)│
   :5000 ─────────────► AI Tutor (node)    │
   :5001 ─────────────► Admin (node)       │
   :8001 ─────────────► Classroom AI (py)  │
            └────────────┬─────────────────┘
                         │
                   MongoDB Atlas (free M0)
```

---

## Part A — One-time AWS setup (in the AWS web console)

### 1. Launch an EC2 instance
1. Console → **EC2** → **Launch instance**.
2. **Name**: `codevidhya`.
3. **AMI**: Ubuntu Server 24.04 LTS (free-tier eligible).
4. **Instance type**: `t3.small` (2 GB RAM). *(If builds feel tight, resize to
   `t3.medium` later — stop instance → Actions → Instance settings → change type.)*
5. **Key pair**: Create a new key pair `codevidhya-key`, download the `.pem`.
   Keep it safe — it's your SSH login.
6. **Network settings → Edit → Security group** — add these inbound rules:
   | Type        | Port | Source     | Why                         |
   |-------------|------|------------|-----------------------------|
   | SSH         | 22   | My IP      | your terminal login         |
   | HTTP        | 80   | Anywhere   | the portal                  |
   | Custom TCP  | 5000 | Anywhere   | AI Tutor                    |
   | Custom TCP  | 5001 | Anywhere   | Admin                       |
   | Custom TCP  | 8001 | Anywhere   | Classroom AI                |
7. **Storage**: 30 GB gp3.
8. **Launch instance**.

### 2. Give it a fixed IP (Elastic IP)
1. EC2 → **Elastic IPs** → **Allocate Elastic IP address** → Allocate.
2. Select it → **Actions → Associate** → choose the `codevidhya` instance.
3. Note this IP — call it `<IP>`. (Keep it associated so you don't get billed
   for an idle one.)

### 3. Allow the box into MongoDB Atlas
- Atlas → your cluster → **Network Access** → **Add IP Address** → enter `<IP>`
  (or `0.0.0.0/0` to allow all — simpler, slightly less safe).

---

## Part B — Deploy on the box

### 4. SSH in
From your machine (PowerShell or Git Bash), in the folder with the `.pem`:
```bash
chmod 400 codevidhya-key.pem          # (Git Bash / mac / linux)
ssh -i codevidhya-key.pem ubuntu@<IP>
```

### 5. Clone the repo + provision
```bash
git clone https://github.com/Kartikeysharma1972/Codevidhya.git
cd Codevidhya
bash deploy/aws/setup-server.sh        # installs node, python, nginx, pm2, swap
```

### 6. Add your secrets
```bash
cp deploy/aws/secrets.env.example deploy/aws/secrets.env
nano deploy/aws/secrets.env            # paste values, set SERVER_IP=<IP>, save (Ctrl+O, Enter, Ctrl+X)
```
> Faster: upload the ready-made `secrets.env` from your own machine instead of
> typing it — from your PC run:
> ```bash
> scp -i codevidhya-key.pem deploy/aws/secrets.env ubuntu@<IP>:~/Codevidhya/deploy/aws/secrets.env
> ```

### 7. Build + start everything
```bash
bash deploy/aws/deploy-apps.sh
```
First run takes a few minutes (installs deps + builds 3 frontends). When it
finishes you'll see the URLs.

### 8. Make it survive reboots
```bash
pm2 startup systemd          # prints a "sudo env PATH=… pm2 startup" line
# copy-paste & run that exact line, then:
pm2 save
```

### 9. Open it
- Portal: `http://<IP>`
- Sign up as Student / Teacher / Admin and confirm the handoff lands you on the
  right app.

---

## Updating later (ship new code)
```bash
ssh -i codevidhya-key.pem ubuntu@<IP>
cd Codevidhya
bash deploy/aws/deploy-apps.sh        # pulls latest, rebuilds, reloads
```

## Handy commands
```bash
pm2 status        # are all 4 apps online?
pm2 logs          # tail all logs
pm2 logs cv-portal
pm2 restart all
free -h           # memory / swap
```

---

## Later: a real domain + HTTPS
Right now it's plain `http://<IP>` (and the AI/upload features run over HTTP).
When you have a domain:
1. Point an **A record** for `codevidhya.com` (and `student.`, `teacher.`,
   `admin.` subdomains) at `<IP>`.
2. Rewrite `nginx-codevidhya.conf` into one `server {}` block per subdomain,
   each `proxy_pass` to the matching local port; update the `VITE_*` URLs +
   `CLIENT_URL`/`CORS_ORIGINS` in `secrets.env` to the `https://…` names.
3. `sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx`
   for free auto-renewing SSL.
Ping me when you reach this step and I'll generate the exact config.
