### Production Deployment Plan: Incantations AI

This plan is built on three core principles:
1. **Isolation**: Production is a fortress, separate from development.
2. **Security**: We assume threats are real and lock down the system from the start.
3. **Data Integrity**: The database and user data are sacred. We never perform risky operations on them and always have a rollback plan.

---

### **Phase 1: Infrastructure Setup (The Foundation)**

1.  **Create a New Production Droplet:**
    *   **Provider**: DigitalOcean
    *   **Plan**: Basic, 2vCPUs, 2GB RAM, 50GB NVMe SSD (~$18/month). This provides breathing room for multiple users.
    *   **Datacenter**: Choose a region closest to your initial users (e.g., NYC, SFO).
    *   **OS**: **Ubuntu 22.04 (LTS)** for long-term support and stability.
    *   **Authentication**: **SSH Key only**. Add your SSH key during creation.

2.  **Initial Server Setup (as a non-root user):**
    *   Log in as `root`.
    *   Create a new user for yourself (e.g., `prod-admin`). Give it `sudo` privileges.
        ```bash
        adduser prod-admin
        usermod -aG sudo prod-admin
        ```
    *   Copy your SSH key to the new user so you can log in directly.
    *   Log out of `root` and log back in as `prod-admin`.
    *   Install essential software:
        ```bash
        sudo apt update && sudo apt upgrade -y
        sudo apt install docker.io docker-compose git -y
        ```

---

### **Phase 2: Security Hardening (The Fortress Walls)**

1.  **Configure the Firewall (UFW - Uncomplicated Firewall):**
    *   **Action**:
        ```bash
        sudo ufw allow OpenSSH       # Allows you to connect via SSH
        sudo ufw allow http         # Allows web traffic on port 80
        sudo ufw allow https        # Allows secure web traffic on port 443
        sudo ufw enable             # Turn the firewall on
        ```

2.  **Disable Root Login & Password Authentication:**
    *   **Action**: Edit the SSH config file: `sudo nano /etc/ssh/sshd_config`.
        *   Find and change `PermitRootLogin` to `no`.
        *   Find and change `PasswordAuthentication` to `no`.
    *   Restart the SSH service to apply changes: `sudo systemctl restart sshd`.

3.  **Install Fail2Ban:**
    *   **Action**:
        ```bash
        sudo apt install fail2ban -y
        sudo systemctl enable fail2ban
        sudo systemctl start fail2ban
        ```

4.  **Set Up Automatic Security Updates:**
    *   **Action**:
        ```bash
        sudo apt install unattended-upgrades -y
        sudo dpkg-reconfigure -plow unattended-upgrades
        ```

---

### **Phase 3: Production Application Deployment**

1.  **Create a Production `docker-compose.prod.yml`:**

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    build:
      context: ./backend
      target: production
    restart: unless-stopped
    env_file: .env.prod # Use a separate production environment file
    volumes:
      - ./backend-data:/app/data # Example for any persistent backend files
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: ./voice-ai-task-manager
      target: production # This uses the NGINX stage
    restart: unless-stopped
    ports:
      - "80:80"   # Nginx will handle traffic
      - "443:443" # Nginx will handle secure traffic

  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    env_file: .env.prod
    volumes:
      - ./postgres-data:/var/lib/postgresql/data # CRITICAL: This keeps your DB data safe on the host
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres-data:
  backend-data:
```

2.  **Create a `.env.prod` file explicitly for production**

---

### **Phase 4: The Safe Deployment Workflow**

1.  **Develop Locally**: Test changes on your local machine.
2.  **Commit to Git**: `git add .`, `git commit -m "New feature"`, `git push origin main`.
3.  **SSH to Production**: `ssh prod-admin@<your-prod-droplet-ip>`.
4.  **Pull Latest Code**: `git pull origin main`.
5.  **Build the New Images**:
    ```bash
    sudo docker-compose -f docker-compose.prod.yml build --no-cache
    ```
6.  **Deploy the New Version**:
    ```bash
    sudo docker-compose -f docker-compose.prod.yml up -d
    ```

**Handling Database Migrations:**
- **Backup first!**
- Run migration command inside backend container.

---

### **Phase 5: Backup & Recovery**

1.  **Automated Database Backups**:
    *   Run `crontab -e` and add this line:
        ```cron
        0 3 * * * sudo docker-compose -f /path/to/your/app/docker-compose.prod.yml exec -T postgres pg_dumpall -c -U your_db_user | gzip > /home/prod-admin/backups/incantations_db_$(date +\%Y-\%m-\%d).sql.gz
        ```

2.  **Droplet Snapshots**:
    *   Enable weekly backups for your production droplet on DigitalOcean.