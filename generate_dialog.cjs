const fs = require('fs');
const lines = fs.readFileSync('src/views/B2BView.vue', 'utf8').split('\n');

let startHTML = lines.findIndex(l => l.includes('v-if=\"showInfoDialog\"'));
let openDivs = 0;
let endHTML = -1;
for (let i = startHTML; i < lines.length; i++) {
  const openMatches = lines[i].match(/<div/g);
  const closeMatches = lines[i].match(/<\/div>/g);
  if (openMatches) openDivs += openMatches.length;
  if (closeMatches) openDivs -= closeMatches.length;
  if (openDivs === 0) { endHTML = i; break; }
}
const htmlStr = lines.slice(startHTML, endHTML + 1).join('\n');

const jsStartStr = 'const showInfoDialog = ref(false)';
const jsEndStr = 'const fetchHistory = async () => {';
let startJS = lines.findIndex(l => l.includes(jsStartStr));
let endJS = lines.findIndex(l => l.includes(jsEndStr)) - 1;
const jsStr = lines.slice(startJS, endJS).join('\n');

let startCSS = lines.findIndex(l => l.includes('/* Article Info Dialog Styles */'));
let endCSS = lines.findIndex(l => l.includes('.client-detail-dialog')) - 1; 
if(endCSS < startCSS) endCSS = lines.length - 1;
const cssStr = lines.slice(startCSS, endCSS).join('\n');

const componentStr = \<template>
\
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useCompareQuoteStore } from '@/stores/compareQuote';

const props = defineProps({
  visible: Boolean,
  articleRef: String,
  manufacturerId: [String, Number],
  descriptionStructured: String,
  manufacturerName: String
});
const emit = defineEmits(['update:visible']);
const compareStore = useCompareQuoteStore();

\

// Override openTecdocDialog to watch props
watch(() => props.visible, (newVal) => {
    if(newVal && props.articleRef && props.manufacturerId) {
        openTecdocDialog({ 
            vendorItemNo: props.articleRef, 
            tecdocIdFabricant: props.manufacturerId,
            descriptionStructured: props.descriptionStructured,
            manufacturerName: props.manufacturerName
        });
    } else {
        selectedInfoItem.value = null;
    }
});

const closeDialog = () => {
    emit('update:visible', false);
};
</script>

<style scoped>
\
</style>\;

fs.writeFileSync('src/components/TecDocArticleDialog.vue', componentStr);
console.log('Created src/components/TecDocArticleDialog.vue');
