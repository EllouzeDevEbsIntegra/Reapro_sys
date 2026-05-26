<template>
  <Teleport to="body">
    <div v-if="visible" class="so-modal-overlay" @click.self="!submitting && $emit('close')">
      <div class="so-modal so-close-modal">
        <!-- Header -->
        <div class="so-modal-header">
          <div class="modal-title-wrap">
            <div class="modal-icon-wrap green">
              <i class="pi pi-check-circle"></i>
            </div>
            <div>
              <h3 class="modal-title">Clôturer l'opportunité</h3>
              <div class="modal-subtitle">
                <span class="ref-chip">{{ normalizedFilter }}</span>
              </div>
            </div>
          </div>
          <button class="modal-close-btn" @click="!submitting && $emit('close')">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <!-- Warning notice -->
        <div class="closure-notice">
          <i class="pi pi-info-circle"></i>
          <span>
            Cette action va <strong>clôturer toutes les lignes existantes non clôturées</strong> pour cette recherche.
            Les nouvelles recherches futures de la même référence réapparaîtront automatiquement.
          </span>
        </div>

        <!-- Body (form) -->
        <div class="so-modal-body">
          <form @submit.prevent="onSubmit" id="close-opp-form" novalidate>
            <div class="form-grid">

              <!-- Diagnostic status -->
              <div class="form-group">
                <label class="form-label required">Diagnostic *</label>
                <select v-model="form.diagnosticStatus" class="form-select" required>
                  <option value="" disabled>Sélectionner...</option>
                  <option v-for="opt in diagnosticOptions" :key="opt.code" :value="opt.code">
                    {{ opt.label }}
                  </option>
                </select>
                <span v-if="errors.diagnosticStatus" class="form-error">{{ errors.diagnosticStatus }}</span>
              </div>

              <!-- Action type -->
              <div class="form-group">
                <label class="form-label required">Action *</label>
                <select v-model="form.actionType" class="form-select" required>
                  <option value="" disabled>Sélectionner...</option>
                  <option v-for="opt in actionOptions" :key="opt.code" :value="opt.code">
                    {{ opt.label }}
                  </option>
                </select>
                <span v-if="errors.actionType" class="form-error">{{ errors.actionType }}</span>
              </div>

              <!-- Closure reason -->
              <div class="form-group form-group-full">
                <label class="form-label required">Motif de clôture *</label>
                <input
                  type="text"
                  v-model="form.closureReason"
                  class="form-input"
                  placeholder="Résumé concis du motif..."
                  maxlength="255"
                />
                <span v-if="errors.closureReason" class="form-error">{{ errors.closureReason }}</span>
              </div>

              <!-- Comment -->
              <div class="form-group form-group-full">
                <label class="form-label">Commentaire</label>
                <textarea
                  v-model="form.comment"
                  class="form-textarea"
                  placeholder="Détails supplémentaires (optionnel)..."
                  rows="3"
                ></textarea>
              </div>

              <!-- Linked article -->
              <div class="form-group form-group-full">
                <label class="form-label">Article lié <span class="optional">(optionnel)</span></label>
                <input
                  type="text"
                  v-model="form.linkedArticleId"
                  class="form-input"
                  placeholder="ID de l'article lié si applicable..."
                />
              </div>

              <!-- Exclude from future sync checkbox -->
              <div class="form-group form-group-full form-group-checkbox">
                <label class="checkbox-label-container">
                  <input type="checkbox" v-model="form.excludeFromFutureSync" class="check-input" />
                  <span class="checkbox-text">Exclure cette recherche des futures analyses (Ignorer définitivement)</span>
                </label>
              </div>

              <!-- Closed by (read-only display) -->
              <div class="form-group form-group-full">
                <label class="form-label">Clôturé par</label>
                <input type="text" :value="form.closedBy" class="form-input readonly" readonly />
              </div>

            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="so-modal-footer">
          <button type="button" class="btn-secondary" :disabled="submitting" @click="$emit('close')">
            Annuler
          </button>
          <button
            type="submit"
            form="close-opp-form"
            class="btn-confirm"
            :disabled="submitting"
            @click.prevent="onSubmit"
          >
            <span v-if="submitting">
              <i class="pi pi-spin pi-spinner"></i>
              Clôture en cours...
            </span>
            <span v-else>
              <i class="pi pi-check-circle"></i>
              Confirmer la clôture
            </span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { getDiagnosticOptions } from '@/api/diagnosticOptionService'
import { getActionOptions } from '@/api/actionOptionService'

const props = defineProps({
  visible:          { type: Boolean, default: false },
  normalizedFilter: { type: String,  default: '' },
  closedBy:         { type: String,  default: 'admin' },
  submitting:       { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'submit'])

const diagnosticOptions = ref([])
const actionOptions = ref([])

const form = reactive({
  diagnosticStatus: '',
  actionType: '',
  closureReason: '',
  comment: '',
  linkedArticleId: null,
  excludeFromFutureSync: false,
  closedBy: props.closedBy
})

const errors = reactive({
  diagnosticStatus: '',
  actionType: '',
  closureReason: ''
})

// Sync closedBy prop
watch(() => props.closedBy, (v) => { form.closedBy = v })

async function loadOptions() {
  try {
    const [diagRes, actRes] = await Promise.all([
      getDiagnosticOptions(),
      getActionOptions()
    ])
    diagnosticOptions.value = diagRes.data || []
    actionOptions.value = actRes.data || []
  } catch (e) {
    console.error('[CloseSearchOpportunityModal] failed to load options', e)
    // fallback to static options if api fails
    diagnosticOptions.value = [
      { code: 'ARTICLE_TO_CREATE', label: 'Article à créer' },
      { code: 'ARTICLE_EXISTS_TO_SUPPLY', label: 'Article existant à approvisionner' },
      { code: 'NOT_RELEVANT', label: 'Non pertinent' },
      { code: 'DUPLICATE_OR_BAD_SEARCH', label: 'Doublon ou mauvaise recherche' },
      { code: 'CLOSED_WITHOUT_ACTION', label: 'Clôturé sans action' }
    ]
    actionOptions.value = [
      { code: 'CREATE_ARTICLE', label: 'Créer article' },
      { code: 'SUPPLY_EXISTING_ARTICLE', label: 'Approvisionner article existant' },
      { code: 'IGNORE', label: 'Ignorer' },
      { code: 'MERGE', label: 'Fusionner / rapprocher' },
      { code: 'NO_ACTION', label: 'Aucune action' }
    ]
  }
}

// Reset form on open
watch(() => props.visible, (v) => {
  if (v) {
    loadOptions()
    form.diagnosticStatus = ''
    form.actionType       = ''
    form.closureReason    = ''
    form.comment          = ''
    form.linkedArticleId  = null
    form.excludeFromFutureSync = false
    form.closedBy         = props.closedBy
    errors.diagnosticStatus = ''
    errors.actionType       = ''
    errors.closureReason    = ''
  }
})

function validate() {
  let ok = true
  errors.diagnosticStatus = form.diagnosticStatus ? '' : 'Le diagnostic est requis.'
  errors.actionType       = form.actionType       ? '' : "Le type d'action est requis."
  errors.closureReason    = form.closureReason?.trim() ? '' : 'Le motif de clôture est requis.'
  if (errors.diagnosticStatus || errors.actionType || errors.closureReason) ok = false
  return ok
}

function onSubmit() {
  if (!validate()) return
  emit('submit', {
    closedBy:              form.closedBy,
    diagnosticStatus:      form.diagnosticStatus,
    actionType:            form.actionType,
    closureReason:         form.closureReason,
    comment:               form.comment || null,
    linkedArticleId:       form.linkedArticleId || null,
    excludeFromFutureSync: form.excludeFromFutureSync
  })
}
</script>

<style scoped>
.so-modal-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  z-index: 1001;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
  animation: fadeIn 0.18s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.so-modal {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.18);
  display: flex; flex-direction: column;
  max-height: 90vh;
  animation: slideUp 0.22s ease;
}
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.so-close-modal { width: 580px; max-width: 98vw; }

/* Header */
.so-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid #f1f5f9;
}
.modal-title-wrap { display: flex; align-items: center; gap: 1rem; }
.modal-icon-wrap {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 1.2rem; flex-shrink: 0;
}
.modal-icon-wrap.green { background: linear-gradient(135deg, #16a34a, #15803d); }
.modal-title { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0; }
.modal-subtitle { margin-top: 2px; }
.ref-chip {
  background: #f0fdf4; color: #16a34a; border: 1px solid #86efac;
  border-radius: 20px; padding: 2px 12px; font-size: 0.8rem; font-weight: 700;
  font-family: monospace;
}
.modal-close-btn {
  width: 36px; height: 36px; border-radius: 9px; border: 1.5px solid #e2e8f0;
  background: #f8fafc; color: #64748b; cursor: pointer; font-size: 1rem;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.modal-close-btn:hover { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }

/* Notice */
.closure-notice {
  display: flex; align-items: flex-start; gap: 0.75rem;
  background: #fffbeb; border-left: 4px solid #f59e0b;
  padding: 0.85rem 1.5rem; font-size: 0.83rem; color: #78350f;
  line-height: 1.5;
}
.closure-notice .pi { flex-shrink: 0; margin-top: 1px; color: #f59e0b; font-size: 1rem; }

/* Body */
.so-modal-body {
  padding: 1.2rem 1.5rem;
  overflow-y: auto; flex: 1;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group-full { grid-column: 1 / -1; }

.form-label {
  font-size: 0.72rem; font-weight: 700; color: #475569;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.optional { font-weight: 400; text-transform: none; color: #94a3b8; font-size: 0.7rem; }

.form-input, .form-select, .form-textarea {
  padding: 0.5rem 0.75rem;
  border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.875rem; color: #1e293b; background: #f8fafc;
  outline: none; transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;
}
.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #1e40af;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
  background: #fff;
}
.form-input.readonly { background: #f1f5f9; color: #64748b; cursor: default; }
.form-textarea { resize: vertical; min-height: 72px; font-family: inherit; }

.form-error { font-size: 0.72rem; color: #dc2626; margin-top: 1px; }

/* Footer */
.so-modal-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #f1f5f9;
}
.btn-secondary {
  padding: 0.55rem 1.2rem; border-radius: 9px;
  border: 1.5px solid #e2e8f0; background: #f8fafc; color: #475569;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  transition: background 0.15s;
}
.btn-secondary:hover:not(:disabled) { background: #e2e8f0; }
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-confirm {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.55rem 1.4rem; border-radius: 9px; border: none;
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: #fff; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: opacity 0.15s, transform 0.15s;
}
.btn-confirm:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.btn-confirm:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

/* Checkbox Style */
.checkbox-label-container {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  padding: 0.25rem 0;
}
.checkbox-text {
  font-size: 0.825rem;
  font-weight: 600;
  color: #334155;
}
.check-input {
  width: 17px;
  height: 17px;
  cursor: pointer;
  accent-color: #1e40af;
  flex-shrink: 0;
}
</style>
