-- Autenticación real: hash bcrypt de la contraseña (null = sin acceso por contraseña)
ALTER TABLE "usuarios" ADD COLUMN "password_hash" VARCHAR(100);
