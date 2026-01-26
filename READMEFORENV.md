# Environment Configuration Backup

This project contains an encrypted backup (`.env.enc`) of the sensitive environment variables used in the project in two folders. [Final-Year/.env.enc](.env.enc) and [Final-Year/frontend/.env.enc](frontend/.env.enc).

## 🔐 How to Decrypt

To restore the original `.env` file, ensure you have **OpenSSL** installed (standard in Git Bash on Windows).

Run the following command in this directory:

```bash
openssl aes-256-cbc -d -pbkdf2 -a -in .env.enc -out .env
```

> **Note:** You will be prompted to enter the password used during encryption.

---

## ⚠️ Fallback Template

**In case decryption fails or the password is lost**, create a new `Final-Year/.env` and `Final-Year/frontend/.env` files and populate the following variables manually:

### Final-Year/.env
```ini
GOOGLE_API_KEY=
JWT_SECRET_KEY=
DATABASE_URL=
ALEMBIC_DATABASE_URL=
PINECONE_API_KEY=
PINECONE_ENVIRONMENT=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=
```
### Final-Year/frontend/.env
```ini
VITE_API_URL=http://localhost:8000
```