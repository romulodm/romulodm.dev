"use client"

import { useCallback } from "react"
import Modal from "@mui/material/Modal"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import CloseIcon from "@mui/icons-material/Close"
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined"

interface TermsModalProps {
  open: boolean
  onClose: () => void
}

export function TermsModal({ open, onClose }: TermsModalProps) {
  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="terms-modal-title"
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
          <DescriptionOutlinedIcon sx={{ color: "#6c63ff", fontSize: 28 }} />
          <Box sx={{ flex: 1 }}>
            <Typography
              id="terms-modal-title"
              variant="h6"
              sx={{ fontWeight: 700, color: "#1a1a2e", fontSize: "1.1rem", lineHeight: 1.3 }}
            >
              Termos e Condições
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
            Importante — Verifique a Rede
          </Typography>
          <Typography variant="body2" sx={{ color: "#4a4a68", lineHeight: 1.7, mb: 2.5 }}>
            Antes de comprar um bilhete, verifique se a loteria está executando na mesma
            rede que a sua carteira. Compras feitas na rede errada não são reembolsáveis e
            não são de responsabilidade da plataforma.
          </Typography>

          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}
          >
            1. Natureza do Serviço
          </Typography>
          <Typography variant="body2" sx={{ color: "#4a4a68", lineHeight: 1.7, mb: 2.5 }}>
            Esta plataforma é uma loteria descentralizada operando na blockchain,
            garantindo total transparência e justiça em todos os sorteios. Atualmente, o
            serviço encontra-se em período de teste na rede Sepolia.
          </Typography>

          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}
          >
            2. Período de Teste
          </Typography>
          <Typography variant="body2" sx={{ color: "#4a4a68", lineHeight: 1.7, mb: 2.5 }}>
            Durante o período de validação, todas as transações são realizadas utilizando
            tokens de teste (Sepolia ETH) que não possuem valor econômico real. Nenhum
            valor monetário verdadeiro está envolvido durante esta fase.
          </Typography>

          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}
          >
            3. Fairness e Transparência
          </Typography>
          <Typography variant="body2" sx={{ color: "#4a4a68", lineHeight: 1.7, mb: 2.5 }}>
            Todos os sorteios são realizados de forma transparente na blockchain. Os
            resultados podem ser verificados por qualquer pessoa através do contrato
            inteligente. A plataforma utiliza fontes de aleatoriedade verificáveis para
            garantir a justiça dos sorteios.
          </Typography>

          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}
          >
            4. Responsabilidade do Utilizador
          </Typography>
          <Typography variant="body2" sx={{ color: "#4a4a68", lineHeight: 1.7, mb: 2.5 }}>
            O utilizador é responsável por garantir que está conectado à rede correta
            antes de realizar qualquer transação. A plataforma não se responsabiliza por
            perdas decorrentes de erros do utilizador, incluindo mas não limitado a envio
            de fundos para endereços incorretos.
          </Typography>

          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#1a1a2e", mb: 1 }}
          >
            5. Modificações dos Termos
          </Typography>
          <Typography variant="body2" sx={{ color: "#4a4a68", lineHeight: 1.7, mb: 0 }}>
            A plataforma reserva-se o direito de modificar estes termos a qualquer
            momento. As alterações serão comunicadas aos utilizadores através da
            plataforma. O uso continuado do serviço após as alterações constitui aceitação
            dos novos termos.
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
