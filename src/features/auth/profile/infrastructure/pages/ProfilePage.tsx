"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { User, Shield, Key, AlertCircle, Camera, Check, RefreshCw } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/infrastructure/shadcn/components/ui/card";
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button";
import { Input } from "@/shared/infrastructure/shadcn/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/shared/infrastructure/shadcn/components/ui/field";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/infrastructure/shadcn/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/infrastructure/shadcn/components/ui/select";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/infrastructure/shadcn/components/ui/avatar";
import { Skeleton } from "@/shared/infrastructure/shadcn/components/ui/skeleton";

import { UpdateProfile, UpdateProfileSchema } from "../../domain/validations/profileSchema";
import { getUserProfileAction } from "../actions/getUserProfileAction";
import { updateProfileAction } from "../actions/updateProfileAction";

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
];

const DICEBEAR_STYLES = [
  { value: "adventurer", label: "Aventurero" },
  { value: "bottts", label: "Robots" },
  { value: "lorelei", label: "Personajes" },
  { value: "pixel-art", label: "Pixel Art" },
  { value: "initials", label: "Iniciales" },
];

export function ProfilePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hasPassword, setHasPassword] = useState(false);
  const [emailVerified, setEmailVerified] = useState<Date | string | null>(null);
  const [verificationEmailActive, setVerificationEmailActive] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Avatar generator states
  const [avatarMode, setAvatarMode] = useState<"preset" | "generator" | "custom">("preset");
  const [dicebearStyle, setDicebearStyle] = useState("adventurer");
  const [dicebearSeed, setDicebearSeed] = useState("");

  const form = useForm<UpdateProfile>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      image: "",
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const { watch, setValue, control, handleSubmit, reset } = form;
  const currentAvatarUrl = watch("image");
  const currentName = watch("name");

  // Load user data
  useEffect(() => {
    async function loadUserData() {
      const result = await getUserProfileAction();
      if (result.success && result.data) {
        const user = result.data;
        reset({
          name: user.name,
          email: user.email,
          image: user.image || "",
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
        setHasPassword(user.hasPassword);
        setEmailVerified(user.emailVerified);
        setVerificationEmailActive(user.verificationEmailActive);

        // Detect current avatar mode
        if (!user.image) {
          setAvatarMode("preset");
        } else if (user.image.includes("api.dicebear.com")) {
          setAvatarMode("generator");
          try {
            const url = new URL(user.image);
            const pathParts = url.pathname.split("/");
            const styleIndex = pathParts.indexOf("svg") - 1;
            if (styleIndex >= 0 && pathParts[styleIndex]) {
              setDicebearStyle(pathParts[styleIndex]);
            }
            const seedParam = url.searchParams.get("seed");
            if (seedParam) {
              setDicebearSeed(seedParam);
            }
          } catch {
            // fallback
          }
        } else if (PRESET_AVATARS.includes(user.image)) {
          setAvatarMode("preset");
        } else {
          setAvatarMode("custom");
        }
      } else {
        toast.error(result.error || "Error al cargar la información del usuario");
      }
      setLoadingProfile(false);
    }
    loadUserData();
  }, [reset]);

  // Update image URL based on Generator choices
  useEffect(() => {
    if (avatarMode === "generator" && dicebearSeed) {
      const generatedUrl = `https://api.dicebear.com/7.x/${dicebearStyle}/svg?seed=${encodeURIComponent(
        dicebearSeed
      )}`;
      setValue("image", generatedUrl, { shouldDirty: true });
    }
  }, [avatarMode, dicebearStyle, dicebearSeed, setValue]);

  const onSubmit = async (data: UpdateProfile) => {
    startTransition(async () => {
      const result = await updateProfileAction(data);
      if (result.success) {
        toast.success(result.message);

        // Reset security fields
        setValue("currentPassword", "");
        setValue("newPassword", "");
        setValue("confirmNewPassword", "");

        // Refresh session on page/layout
        router.refresh();

        if (result.emailChanged) {
          toast.info("Por favor, verifica tu nuevo correo electrónico.");
          router.push("/auth/verify-email");
        }
      } else {
        toast.error(result.error || "Error al actualizar el perfil");
      }
    });
  };

  if (loadingProfile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        <div className="relative rounded-2xl overflow-hidden border border-border/40 shadow-xl bg-card">
          <Skeleton className="h-32 md:h-44 w-full rounded-none" />
          <div className="p-4 relative flex flex-col md:flex-row items-center gap-6 -mt-10 md:-mt-16 border-b border-border/40 bg-card">
            <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-card shrink-0" />
            <div className="flex-1 space-y-2 text-center md:text-left md:pb-2">
              <Skeleton className="h-5 w-40 mx-auto md:mx-0" />
              <Skeleton className="h-6 w-52 mx-auto md:mx-0" />
              <Skeleton className="h-4 w-36 mx-auto md:mx-0" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          <div className="lg:col-span-1 w-full space-y-6">
            <Skeleton className="h-56 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-2 w-full space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10 animate-in fade-in duration-300">
      {/* Banner & Profile Header Card */}
      <div className="relative rounded-2xl overflow-hidden border border-border/40 shadow-xl bg-card">
        {/* Banner */}
        <div className="h-32 md:h-44 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 dark:from-violet-850 dark:via-indigo-850 dark:to-blue-850 relative">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"></div>
        </div>
        {/* Profile Header Contents */}
        <div className="p-4 relative flex flex-col md:flex-row items-center gap-6 -mt-10 md:-mt-16 border-b border-border/40 bg-card select-none">
          {/* Avatar Container */}
          <div className="relative group shrink-0">
            <Avatar className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-card shadow-2xl bg-card">
              <AvatarImage src={currentAvatarUrl || ""} alt={currentName || "User"} className="object-cover" />
              <AvatarFallback className="rounded-full bg-primary/10 text-primary text-2xl md:text-4xl font-bold">
                {currentName ? currentName.slice(0, 2).toUpperCase() : "US"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer border-4 border-transparent">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>
          {/* Name and Email */}
          <div className="flex-1 text-center md:text-left space-y-1 md:pb-2">
            {/* Verification Badge */}
            {emailVerified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 w-fit mx-auto md:mx-0">
                <Check className="h-3.5 w-3.5 stroke-[3px]" />
                Cuenta Verificada
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 w-fit mx-auto md:mx-0">
                <AlertCircle className="h-3.5 w-3.5" />
                Verificación Pendiente
              </span>
            )}
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">{currentName || "Usuario"}</h2>
            <p className="text-sm text-muted-foreground">{watch("email") || "sin correo"}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Left Column: Visual Identity (Fixed Width) */}
          <div className="lg:col-span-1 w-full min-w-0 space-y-6">
            <Card className="border-border/40 shadow-lg bg-card overflow-hidden">
              <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" />
                  Identidad Visual
                </CardTitle>
                <CardDescription className="text-xs">
                  Personaliza cómo te ves en la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Dropdown Select Mode */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Origen del Avatar</label>
                  <Select
                    value={avatarMode}
                    onValueChange={(val) => {
                      setAvatarMode(val as "preset" | "generator" | "custom");
                      if (val === "preset") {
                        setValue("image", PRESET_AVATARS[0], { shouldDirty: true });
                      } else if (val === "generator" && !dicebearSeed) {
                        setDicebearSeed(currentName || "avatar");
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue placeholder="Selecciona origen de avatar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preset" className="text-xs">Galería de Presets</SelectItem>
                      <SelectItem value="generator" className="text-xs">Generador DiceBear</SelectItem>
                      <SelectItem value="custom" className="text-xs">URL de Imagen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Preset Panel */}
                {avatarMode === "preset" && (
                  <div className="space-y-2 animate-in fade-in-50 duration-200">
                    <div className="text-xs font-semibold text-muted-foreground">Selecciona un avatar:</div>
                    <div className="grid grid-cols-4 gap-2">
                      {PRESET_AVATARS.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setValue("image", url, { shouldDirty: true })}
                          className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all duration-300 transform hover:scale-105 cursor-pointer ${currentAvatarUrl === url
                            ? "border-primary ring-2 ring-primary/20 scale-105 shadow-md"
                            : "border-border/50 opacity-70 hover:opacity-100"
                            }`}
                        >
                          <img src={url} alt={`Preset ${i + 1}`} className="object-cover h-full w-full" />
                          {currentAvatarUrl === url && (
                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                              <Check className="h-4 w-4 text-primary stroke-[3px]" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generator Panel */}
                {avatarMode === "generator" && (
                  <div className="space-y-2 animate-in fade-in-50 duration-200">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Estilo
                      </label>
                      <Select value={dicebearStyle} onValueChange={setDicebearStyle}>
                        <SelectTrigger className="w-full h-9 text-xs">
                          <SelectValue placeholder="Estilo" />
                        </SelectTrigger>
                        <SelectContent>
                          {DICEBEAR_STYLES.map((style) => (
                            <SelectItem key={style.value} value={style.value} className="text-xs">
                              {style.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                        Semilla (Seed)
                        <button
                          type="button"
                          onClick={() => setDicebearSeed(Math.random().toString(36).substring(7))}
                          className="text-[10px] text-primary hover:underline flex items-center gap-1 font-normal lowercase cursor-pointer"
                        >
                          <RefreshCw className="h-2.5 w-2.5" />
                          aleatorio
                        </button>
                      </label>
                      <Input
                        value={dicebearSeed}
                        onChange={(e) => setDicebearSeed(e.target.value)}
                        placeholder="Semilla (ej. tu nombre)"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Custom Panel */}
                {avatarMode === "custom" && (
                  <div className="space-y-2 animate-in fade-in-50 duration-200">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      URL de Imagen Externa
                    </label>
                    <Controller
                      name="image"
                      control={control}
                      render={({ field, fieldState }) => (
                        <div className="space-y-1">
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="https://ejemplo.com/foto.jpg"
                            className="h-9 text-xs"
                          />
                          {fieldState.error && (
                            <p className="text-[11px] text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {fieldState.error.message}
                            </p>
                          )}
                        </div>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Settings Form (Fixed Width) */}
          <div className="lg:col-span-2 w-full min-w-0">
            <Card className="border-border/40 shadow-lg bg-card overflow-hidden">
              <Tabs defaultValue="personal" className="w-full">
                <div className="border-b border-border/40 bg-muted/20 px-3 pb-3">
                  <TabsList className="bg-transparent h-12 p-0 border-b border-transparent gap-4">
                    <TabsTrigger
                      value="personal"
                      className="border-b-2 border-transparent data-active:border-primary data-active:bg-transparent shadow-none font-semibold text-sm cursor-pointer flex items-center gap-2 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 [&[data-state=active]]:border-primary"
                    >
                      <User className="h-4 w-4" />
                      Información Personal
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="border-b-2 border-transparent data-active:border-primary data-active:bg-transparent shadow-none font-semibold text-sm cursor-pointer flex items-center gap-2 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 [&[data-state=active]]:border-primary"
                    >
                      <Shield className="h-4 w-4" />
                      Seguridad & Acceso
                    </TabsTrigger>
                  </TabsList>
                </div>

                <CardContent className="p-6">
                  {/* Tab 1: Personal Info */}
                  <TabsContent value="personal" className="w-full space-y-5 outline-none m-0 focus:outline-none focus-visible:outline-none">
                    <Controller
                      name="name"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="name" className="text-xs font-semibold text-foreground">Nombre de Usuario</FieldLabel>
                          <Input
                            {...field}
                            id="name"
                            placeholder="Ingresa tu nombre de usuario"
                            autoComplete="name"
                            className="h-10 border-input bg-transparent"
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <Controller
                      name="email"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="email" className="text-xs font-semibold text-foreground">Correo Electrónico</FieldLabel>
                          <Input
                            {...field}
                            id="email"
                            type="email"
                            placeholder="correo@ejemplo.com"
                            autoComplete="email"
                            className="h-10 border-input bg-transparent"
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          {verificationEmailActive && (
                            <div className="bg-amber-500/5 rounded-xl border border-amber-500/10 p-3 mt-2">
                              <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                                <span>
                                  <strong>Advertencia de verificación:</strong> Si actualizas tu correo electrónico, tu cuenta requerirá una nueva verificación OTP antes de que puedas seguir utilizando las funcionalidades del sistema.
                                </span>
                              </p>
                            </div>
                          )}
                        </Field>
                      )}
                    />
                  </TabsContent>

                  {/* Tab 2: Security Settings */}
                  <TabsContent value="security" className="w-full space-y-5 outline-none m-0 focus:outline-none focus-visible:outline-none">
                    {!hasPassword && (
                      <div className="bg-violet-500/5 rounded-xl border border-violet-500/15 p-4 mb-2">
                        <p className="text-xs text-violet-600 dark:text-violet-400 leading-relaxed flex gap-2 font-medium">
                          <Key className="h-4 w-4 shrink-0 mt-0.5 text-violet-500" />
                          <span>
                            Estás registrado con un proveedor OAuth externo (Google o GitHub). Si deseas habilitar el inicio de sesión directo con contraseña, puedes configurar tu nueva contraseña aquí.
                          </span>
                        </p>
                      </div>
                    )}

                    {hasPassword && (
                      <Controller
                        name="currentPassword"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="currentPassword" className="text-xs font-semibold text-foreground">Contraseña Actual</FieldLabel>
                            <Input
                              {...field}
                              id="currentPassword"
                              type="password"
                              placeholder="••••••••"
                              autoComplete="current-password"
                              className="h-10 border-input bg-transparent"
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Controller
                        name="newPassword"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="newPassword" className="text-xs font-semibold text-foreground">Nueva Contraseña</FieldLabel>
                            <Input
                              {...field}
                              id="newPassword"
                              type="password"
                              placeholder="••••••••"
                              autoComplete="new-password"
                              className="h-10 border-input bg-transparent"
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />

                      <Controller
                        name="confirmNewPassword"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="confirmNewPassword" className="text-xs font-semibold text-foreground">Confirmar Nueva Contraseña</FieldLabel>
                            <Input
                              {...field}
                              id="confirmNewPassword"
                              type="password"
                              placeholder="••••••••"
                              autoComplete="new-password"
                              className="h-10 border-input bg-transparent"
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </div>
                  </TabsContent>
                </CardContent>

                <div className="border-t border-border/40 p-4 bg-muted/10 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="h-10 px-6 font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                  >
                    {isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Guardando cambios...
                      </>
                    ) : (
                      "Guardar Cambios"
                    )}
                  </Button>
                </div>
              </Tabs>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ProfilePage;
