"use client";

import { useCallback } from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import CookieOutlinedIcon from "@mui/icons-material/CookieOutlined";
import { useTranslations } from "next-intl";

interface CookiePolicyModalProps {
  open: boolean;
  onClose: () => void;
}

export function CookiePolicyModal({ open, onClose }: CookiePolicyModalProps) {
  const t = useTranslations("legal.cookiePolicy");
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="cookie-policy-modal-title"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        backdropFilter: "blur(4px)",
      }}
    >
      <Box
        role="dialog"
        aria-modal="true"
        sx={{
          position: "relative",
          width: 560,
          maxWidth: "100%",
          maxHeight: "85vh",
          outline: "none",
          borderRadius: 3,
          bgcolor: "#ffffff",
          boxShadow: "0 24px 48px rgba(0,0,0,0.16)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          "@media (max-width:600px)": {
            width: "100%",
            height: "100%",
            maxHeight: "100%",
            borderRadius: 0,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 3,
            pt: 3,
            pb: 2,
            borderBottom: "1px solid",
            borderColor: "rgba(0,0,0,0.08)",
          }}
        >
          <CookieOutlinedIcon sx={{ color: "#6c63ff", fontSize: 28 }} />
          <Box sx={{ flex: 1 }}>
            <Typography
              id="cookie-policy-modal-title"
              variant="h6"
              sx={{ fontWeight: 700, color: "#1a1a2e", fontSize: "1.1rem", lineHeight: 1.3 }}
            >
              {t("title")}
            </Typography>
            <Typography variant="caption" sx={{ color: "#8888a0" }}>
              {t("updatedAt")}
            </Typography>
          </Box>
          <IconButton
            aria-label={t("close")}
            onClick={handleClose}
            size="small"
            sx={{
              color: "#8888a0",
              "&:hover": { color: "#1a1a2e", bgcolor: "rgba(0,0,0,0.04)" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 3,
            py: 2.5,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}>
            {t("sections.whatAreCookies.title")}
          </Typography>
          <Typography variant="body2" sx={{ color: "#4a4a68", lineHeight: 1.7, mb: 2.5 }}>
            {t("sections.whatAreCookies.body")}
          </Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}>
            {t("sections.essential.title")}
          </Typography>
          <Typography variant="body2" sx={{ color: "#4a4a68", lineHeight: 1.7, mb: 2.5 }}>
            {t("sections.essential.body")}
          </Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}>
            {t("sections.performance.title")}
          </Typography>
          <Typography variant="body2" sx={{ color: "#4a4a68", lineHeight: 1.7, mb: 2.5 }}>
            {t("sections.performance.body")}
          </Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}>
            {t("sections.functionality.title")}
          </Typography>
          <Typography variant="body2" sx={{ color: "#4a4a68", lineHeight: 1.7, mb: 2.5 }}>
            {t("sections.functionality.body")}
          </Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}>
            {t("sections.targeting.title")}
          </Typography>
          <Typography variant="body2" sx={{ color: "#4a4a68", lineHeight: 1.7, mb: 2.5 }}>
            {t("sections.targeting.body")}
          </Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}>
            {t("sections.manage.title")}
          </Typography>
          <Typography variant="body2" sx={{ color: "#4a4a68", lineHeight: 1.7, mb: 0 }}>
            {t("sections.manage.body")}
          </Typography>
        </Box>

        <Box sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button
            variant="contained"
            onClick={handleClose}
            fullWidth
            sx={{
              bgcolor: "#6c63ff",
              color: "#fff",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
              py: 1.3,
              fontSize: "0.95rem",
              boxShadow: "0 4px 14px rgba(108,99,255,0.4)",
              "&:hover": {
                bgcolor: "#5a52e0",
                boxShadow: "0 6px 20px rgba(108,99,255,0.5)",
              },
            }}
          >
            {t("close")}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
