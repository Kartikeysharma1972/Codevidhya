# Codevidhya — AWS Deployment Log (exactly what we did, in order)

A complete, copy-paste record of how Codevidhya was deployed on AWS, plus the
Groq API key-rotation we added afterwards. Follow top to bottom to reproduce.

**Live setup:**
- Server: 1 × EC2 `t3.small`, Ubuntu 24.04, region **Mumbai (ap-south-1)**
- Public IP (Elastic): **13.234.206.230**
- Instance ID: **i-09b7199de966295a9**
- Database: MongoDB Atlas (free M0) — unchanged
- All 4 apps on one box, managed by **pm2**, fronted by **nginx**

```
Internet ──► nginx :80 ──► Portal :4000 (auth + proxy)
             AI Tutor :5000 · Admin :5001 · Classroom AI :8001
                              │
                        MongoDB Atlas
```

Two kinds of windows are used below — keep them straight:
- **LOCAL** = your Windows PowerShell, prompt looks like `PS C:\Users\ss>`
- **SERVER** = inside the EC2 box, prompt looks like `ubuntu@ip-172-31-...:~$`

---

## PART 1 — One-time AWS Console setup (done in the browser)

### Step 1 — Region
AWS Console → top-right region selector → **Asia Pacific (Mumbai) ap-south-1**.
(Closest to Indian users = lowest latency = fastest.)

### Step 2 — Launch EC2 instance
EC2 → **Launch instance**:
- Name: `codevidhya`
- AMI: **Ubuntu Server 24.04 LTS**
- Instance type: **t3.small** (paid from the $200 credit, ~$15/mo — not free-tier)
- Key pair: **Create new** → `codevidhya-key` → RSA / `.pem` → downloaded to `Downloads`
- Storage: **30 GiB** gp3
- Launch.

### Step 3 — Open ports (Security Group)
EC2 → instance → **Security** tab → click the security group → **Edit inbound rules**:

| Type       | Port | Source       | For          |
|------------|------|--------------|--------------|
| SSH        | 22   | My IP        | SSH login    |
| HTTP       | 80   | Anywhere     | Portal       |
| Custom TCP | 5000 | Anywhere     | AI Tutor     |
| Custom TCP | 5001 | Anywhere     | Admin        |
| Custom TCP | 8001 | Anywhere     | Classroom AI |

Save rules.

### Step 4 — Fixed IP (Elastic IP)
EC2 → **Elastic IPs** → **Allocate** → select it → **Actions → Associate** →
Instance `codevidhya` → **Associate**.
Result: **13.234.206.230** (never changes).

### Step 5 — Let the server reach MongoDB Atlas
Atlas → **Network Access** → **Add IP Address** → `13.234.206.230`
(or `0.0.0.0/0` to allow all — simpler).

---

## PART 2 — Deploy on the server

### Step 6 — Fix the key permission (LOCAL, run once)
```powershell
cd $env:USERPROFILE\Downloads
icacls codevidhya-key.pem /inheritance:r
icacls codevidhya-key.pem /grant:r "$($env:USERNAME):R"
```

### Step 7 — SSH into the server (LOCAL)
```powershell
ssh -i "C:\Users\ss\Downloads\codevidhya-key.pem" ubuntu@13.234.206.230
```
First time it asks to continue → type `yes`. Prompt becomes `ubuntu@ip-...:~$`.

### Step 8 — Get the code + provision the box (SERVER)
The repo is **private**, so cloning needs a GitHub token (Personal Access Token):
- On GitHub: **Settings → Developer settings → Personal access tokens →
  Tokens (classic) → Generate** → tick **repo** → copy the `ghp_...` token.

Then on the server (replace `TOKEN`):
```bash
cd ~ && git clone https://TOKEN@github.com/Kartikeysharma1972/Codevidhya.git
cd ~/Codevidhya
bash deploy/aws/setup-server.sh
```
`setup-server.sh` installs Node 20, Python, nginx, pm2, and a 4 GB swap file.
Wait for **"Provisioning done."**

### Step 9 — Put the secrets on the server
`secrets.env` holds all the MongoDB / JWT / Groq values. It is **gitignored**, so
it is uploaded separately (never committed). The filled file lives on the local
machine at `C:\Users\ss\desktop\codevidhya\deploy\aws\secrets.env`.

Upload it from a **LOCAL** window (short form so the line never breaks):
```powershell
cd "C:\Users\ss\desktop\codevidhya\deploy\aws"
scp -i "$HOME\Downloads\codevidhya-key.pem" secrets.env ubuntu@13.234.206.230:Codevidhya/deploy/aws/secrets.env
```
Look for `100%`.

> Tip: `scp` only runs in a LOCAL window (`PS C:\...`). Running it inside the
> server (`ubuntu@...`) fails — that was the main gotcha during setup.

### Step 10 — Build + start everything (SERVER)
```bash
cd ~/Codevidhya && bash deploy/aws/deploy-apps.sh
```
This writes each app's `.env` from `secrets.env`, builds all 4 apps, configures
nginx, and starts them with pm2. Ends with:
```
==> Deploy complete.
    Portal: http://13.234.206.230   AI Tutor:5000  Classroom:8001  Admin:5001
```

### Step 11 — Survive reboots (SERVER)
```bash
pm2 startup systemd
# copy-paste & run the long "sudo env PATH=... pm2 startup" line it prints, then:
pm2 save
```

### Step 12 — Test
Open **http://13.234.206.230** → sign up / log in → confirm it lands on the
right app (AI Tutor / Classroom / Admin).

---

## PART 3 — Groq API key rotation (added later, for demo safety)

Goal: keep 5 Groq keys; if one hits its rate limit, the apps auto-switch to the
next key — no manual retry during a demo.

### What changed in code
- `student/Ai Tutor/server/routes/ai.js` — added a key pool + `groqCreate()`
  that rotates keys on 429 / quota / capacity errors (replaced the single client).
- `teacher/classroom-ai-main/backend/main.py` — added a `RotatingGroq` client
  (drop-in for the OpenAI client) that does the same across all call sites.
- `deploy/aws/deploy-apps.sh` — writes `GROQ_API_KEYS` into both apps' `.env`.
- `deploy/aws/secrets.env` — added `GROQ_API_KEYS=key1,key2,key3,key4,key5`.

Both read `GROQ_API_KEYS` (comma-separated); a single `GROQ_API_KEY` still works
as fallback.

### How we shipped it
1. Code + push (done from the dev machine):
   ```bash
   git add -A && git commit -m "Add Groq API key rotation" && git push origin main
   ```
2. Re-upload the updated secrets (LOCAL — it now has GROQ_API_KEYS):
   ```powershell
   cd "C:\Users\ss\desktop\codevidhya\deploy\aws"
   scp -i "$HOME\Downloads\codevidhya-key.pem" secrets.env ubuntu@13.234.206.230:Codevidhya/deploy/aws/secrets.env
   ```
3. Pull + redeploy (SERVER):
   ```bash
   cd ~/Codevidhya && git pull && bash deploy/aws/deploy-apps.sh
   ```

### Verify the keys loaded (SERVER)
```bash
echo "AI Tutor keys:"; grep '^GROQ_API_KEYS=' "$HOME/Codevidhya/student/Ai Tutor/server/.env" | tr ',' '\n' | grep -c gsk_
echo "Classroom keys:"; grep '^GROQ_API_KEYS=' "$HOME/Codevidhya/teacher/classroom-ai-main/backend/.env" | tr ',' '\n' | grep -c gsk_
pm2 logs --nostream --lines 200 | grep -i "loaded.*API key"
```
Expect `5` for both apps and `[groq] loaded 5 API key(s) for rotation` in the logs.

---

## PART 4 — Everyday operations

### Ship new code (after you push to GitHub)
```powershell
# LOCAL
ssh -i "C:\Users\ss\Downloads\codevidhya-key.pem" ubuntu@13.234.206.230
```
```bash
# SERVER
cd ~/Codevidhya && git pull && bash deploy/aws/deploy-apps.sh
```

### Status / logs (SERVER)
```bash
pm2 status            # are all 4 apps online?
pm2 logs              # live logs (Ctrl+C to exit)
pm2 logs cv-ai-tutor  # one app
pm2 restart all
free -h               # memory / swap
```

### App ↔ process names
| App          | pm2 name       | Port |
|--------------|----------------|------|
| Portal       | `cv-portal`    | 4000 |
| AI Tutor     | `cv-ai-tutor`  | 5000 |
| Admin        | `cv-admin`     | 5001 |
| Classroom AI | `cv-classroom` | 8001 |

### Save money
AWS Console → EC2 → instance → **Stop** when not needed; **Start** to resume
(the Elastic IP stays attached).

---

## PART 5 — Files that drive all this
| File | Purpose |
|------|---------|
| `deploy/aws/setup-server.sh`     | one-time box provisioning |
| `deploy/aws/deploy-apps.sh`      | build + (re)start all apps, writes `.env`s |
| `deploy/aws/ecosystem.config.cjs`| pm2 process definitions |
| `deploy/aws/nginx-codevidhya.conf`| nginx (port 80 → portal) |
| `deploy/aws/secrets.env`         | all secrets (gitignored, never pushed) |
| `deploy/aws/secrets.env.example` | template for `secrets.env` |

---

## Later: domain + HTTPS (not done yet)
Right now it's `http://13.234.206.230` (plain HTTP). When a domain is ready:
point A-records at the IP, switch nginx to per-subdomain server blocks, update
`VITE_*` / `CLIENT_URL` / `CORS_ORIGINS` to the `https://…` names, then run
`sudo certbot --nginx` for free auto-renewing SSL.
