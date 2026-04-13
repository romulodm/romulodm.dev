"use client"

import { useCallback } from "react"
import Modal from "@mui/material/Modal"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import CloseIcon from "@mui/icons-material/Close"
import CookieOutlinedIcon from "@mui/icons-material/CookieOutlined"

interface CookiePolicyModalProps {
  open: boolean
  onClose: () => void
}

export function CookiePolicyModal({ open, onClose }: CookiePolicyModalProps) {
  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

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
        {/* Header */}
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
              Política de Cookies
            </Typography>
            <Typography variant="caption" sx={{ color: "#8888a0" }}>
              Última atualização: Fevereiro 2026
            </Typography>
          </Box>
          <IconButton
            aria-label="Fechar"
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

        {/* Scrollable Content */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 3,
            py: 2.5,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}
          >
            O que são cookies?
          </Typography>
          <Typography variant="body2" sx={{ color: "#4a4a68", lineHeight: 1.7, mb: 2.5 }}>
            Cookies são pequenos ficheiros de texto que são armazenados no seu dispositivo
            (computador, tablet ou telemóvel) quando visita um website. São amplamente
            utilizados para fazer os websites funcionarem de forma mais eficiente, assim
            como para fornecer informações aos proprietários do site.
          </Typography>

          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}
          >
            1. Cookies Essenciais
          </Typography>
          <Typography variant="body2" sx={{ color: "#4a4a68", lineHeight: 1.7, mb: 2.5 }}>
            Estes cookies são necessários para o funcionamento básico do website. Incluem
            cookies que permitem iniciar sessão em áreas seguras do nosso website ou
            utilizar funcionalidades essenciais. Sem estes cookies, os serviços que
            solicitou não podem ser fornecidos.
          </Typography>

          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}
          >
            2. Cookies de Desempenho
          </Typography>
          <Typography variant="body2" sx={{ color: "#4a4a68", lineHeight: 1.7, mb: 2.5 }}>
            Estes cookies recolhem informações sobre como os visitantes utilizam o website,
            por exemplo, quais as páginas mais visitadas e se recebem mensagens de erro.
            Estes cookies não recolhem informações que identifiquem o visitante. Todas as
            informações recolhidas por estes cookies são agregadas e, portanto, anónimas.
          </Typography>

          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}
          >
            3. Cookies de Funcionalidade
          </Typography>
          <Typography variant="body2" sx={{ color: "#4a4a68", lineHeight: 1.7, mb: 2.5 }}>
            Estes cookies permitem que o website se lembre das escolhas que faz (como o seu
            nome de utilizador, idioma ou a região em que se encontra) e forneça
            funcionalidades melhoradas e mais personalizadas. A informação que estes
            cookies recolhem pode ser anonimizada e não podem rastrear a sua atividade de
            navegação noutros websites.
          </Typography>

          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}
          >
            4. Cookies de Segmentação
          </Typography>
          <Typography variant="body2" sx={{ color: "#4a4a68", lineHeight: 1.7, mb: 2.5 }}>
            Estes cookies são utilizados para apresentar conteúdo mais relevante para si e
            para os seus interesses. Também podem ser utilizados para limitar o número de
            vezes que vê um anúncio e ajudar a medir a eficácia de campanhas
            publicitárias.
          </Typography>

          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}
          >
            5. Como gerir cookies
          </Typography>
          <Typography variant="body2" sx={{ color: "#4a4a68", lineHeight: 1.7, mb: 0 }}>
            A maioria dos browsers permite controlar cookies através das suas
            configurações de preferências. No entanto, se limitar a capacidade dos websites
            de definir cookies, poderá piorar a sua experiência geral de utilização, uma
            vez que deixará de ser personalizada. Também poderá impedi-lo de guardar
            configurações personalizadas, como informações de início de sessão.
          </Typography>
        </Box>

        {/* Footer */}
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
            Fechar
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}
