const fs = require('fs');

// Read the file
const content = fs.readFileSync('d:\\Reapro_sys\\src\\components\\CompareQuoteLineDetail.vue', 'utf-8');

// Pattern to find in Equivalence table tbody
const oldPattern = `                            <tbody>\r
                                <tr v-for="i in 4" :key="i">\r
                                    <td>&nbsp;</td>\r
                                    <td></td>\r
                                    <td></td>\r
                                    <td></td>\r
                                    <td></td>\r
                                    <td></td>\r
                                </tr>\r
                            </tbody>`;

const newContent = `                            <tbody>\r
                                <tr v-if="isLoadingEquivalence">\r
                                    <td colspan="6" class="text-center p-4">Chargement...</td>\r
                                </tr>\r
                                <tr v-else-if="equivalenceItems.length === 0">\r
                                    <td colspan="6" class="text-center p-4">Aucune donnée disponible</td>\r
                                </tr>\r
                                <tr v-else v-for="item in equivalenceItems" :key="item.id">\r
                                    <td>\r
                                        <div class="cell-reference">{{ item.vendorNo }}</div>\r
                                    </td>\r
                                    <td>\r
                                        <div class="cell-reference">{{ item.no }}</div>\r
                                        <div class="cell-description">{{ item.descriptionStructured }}</div>\r
                                    </td>\r
                                    <td>\r
                                        <div class="cell-reference">{{ item.qtyStock }}</div>\r
                                    </td>\r
                                    <td>\r
                                        <div class="cell-reference">{{ formatNumber(item.lastCurrPrice, 2) }}</div>\r
                                        <div class="cell-description">{{ item.lastDate }}</div>\r
                                    </td>\r
                                    <td>\r
                                        <div class="cell-reference">{{ formatNumber(item.lastPurshCostDS, 2) }}</div>\r
                                        <div class="cell-description">{{ item.lastPurshDate }}</div>\r
                                    </td>\r
                                    <td>\r
                                        <div class="cell-reference"></div>\r
                                    </td>\r
                                </tr>\r
                            </tbody>`;

// Replace
const updated = content.replace(oldPattern, newContent);

// Write back
fs.writeFileSync('d:\\Reapro_sys\\src\\components\\CompareQuoteLineDetail.vue', updated, 'utf-8');

console.log("File updated successfully!");
