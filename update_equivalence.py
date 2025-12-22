import re

# Read the file
with open('d:\\Reapro_sys\\src\\components\\CompareQuoteLineDetail.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find in Equivalence table tbody
old_pattern = r'''                            <tbody>
                                <tr v-for="i in 4" :key="i">
                                    <td>&nbsp;</td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            </tbody>'''

new_content = '''                            <tbody>
                                <tr v-if="isLoadingEquivalence">
                                    <td colspan="6" class="text-center p-4">Chargement...</td>
                                </tr>
                                <tr v-else-if="equivalenceItems.length === 0">
                                    <td colspan="6" class="text-center p-4">Aucune donnée disponible</td>
                                </tr>
                                <tr v-else v-for="item in equivalenceItems" :key="item.id">
                                    <td>
                                        <div class="cell-reference">{{ item.vendorNo }}</div>
                                    </td>
                                    <td>
                                        <div class="cell-reference">{{ item.no }}</div>
                                        <div class="cell-description">{{ item.descriptionStructured }}</div>
                                    </td>
                                    <td>
                                        <div class="cell-reference">{{ item.qtyStock }}</div>
                                    </td>
                                    <td>
                                        <div class="cell-reference">{{ formatNumber(item.lastCurrPrice, 2) }}</div>
                                        <div class="cell-description">{{ item.lastDate }}</div>
                                    </td>
                                    <td>
                                        <div class="cell-reference">{{ formatNumber(item.lastPurshCostDS, 2) }}</div>
                                        <div class="cell-description">{{ item.lastPurshDate }}</div>
                                    </td>
                                    <td>
                                        <div class="cell-reference"></div>
                                    </td>
                                </tr>
                            </tbody>'''

# Replace
content = content.replace(old_pattern, new_content)

# Write back
with open('d:\\Reapro_sys\\src\\components\\CompareQuoteLineDetail.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print("File updated successfully!")
