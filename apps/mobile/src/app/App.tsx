import { useState } from 'react';
import {
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { marketplaceSeed, type BusinessCategory } from 'types';
import {
  buildWhatsAppLink,
  calculateAverageRating,
  formatCurrency,
} from 'utils';

import { BrandLogo } from './components/brand-logo';

const palette = {
  primary: '#1F3C5A',
  secondary: '#4FBF9F',
  accent: '#F4C542',
  background: '#F5F7F8',
  surface: '#FFFFFF',
  border: '#D8DEE4',
  text: '#13273B',
  textMuted: '#5C7084',
};

const categories: Array<{ key: BusinessCategory | 'ALL'; label: string }> = [
  { key: 'ALL', label: 'Todo' },
  { key: 'GENERAL_STORE', label: 'Tiendas' },
  { key: 'RESTAURANT', label: 'Comida' },
  { key: 'SERVICE', label: 'Servicios' },
];

export const App = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<BusinessCategory | 'ALL'>('ALL');

  const approvedBusinesses = marketplaceSeed.businesses
    .filter((business) => business.status === 'APPROVED')
    .filter((business) =>
      category === 'ALL' ? true : business.category === category,
    )
    .filter((business) => {
      if (!search.trim()) {
        return true;
      }

      const normalizedSearch = search.toLowerCase();
      return [business.name, business.description, business.location.zone].some(
        (value) => value.toLowerCase().includes(normalizedSearch),
      );
    })
    .map((business) => {
      const reviews = marketplaceSeed.reviews.filter(
        (review) => review.businessId === business.id,
      );
      const promotion = marketplaceSeed.promotions.find(
        (item) => item.businessId === business.id,
      );
      return {
        ...business,
        rating: calculateAverageRating(reviews),
        reviewCount: reviews.length,
        promotion,
      };
    });

  const featuredPromotion = marketplaceSeed.promotions[0];
  const featuredBusiness = approvedBusinesses[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={palette.background} barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <BrandLogo size={68} />
          <Text style={styles.heroEyebrow}>ENCUENTRALOTODO MOBILE</Text>
          <Text style={styles.heroTitle}>
            Descubre negocios locales y cierra por WhatsApp.
          </Text>
          <Text style={styles.heroText}>
            Versión inicial en Expo para validar discovery, promos y contacto
            inmediato desde móvil.
          </Text>
        </View>

        <View style={styles.searchBox}>
          <TextInput
            onChangeText={setSearch}
            placeholder="Busca negocios o zonas"
            placeholderTextColor={palette.textMuted}
            style={styles.searchInput}
            value={search}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRow}
        >
          {categories.map((item) => {
            const active = item.key === category;
            return (
              <Pressable
                key={item.key}
                onPress={() => setCategory(item.key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  style={[styles.chipLabel, active && styles.chipLabelActive]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {featuredPromotion ? (
          <View style={styles.promoCard}>
            <Text style={styles.promoEyebrow}>PROMO ACTIVA</Text>
            <Text style={styles.promoTitle}>{featuredPromotion.title}</Text>
            <Text style={styles.promoText}>
              {featuredPromotion.description}
            </Text>
            <View style={styles.promoPricing}>
              <Text style={styles.promoPrice}>
                {formatCurrency(featuredPromotion.promoPrice)}
              </Text>
              <Text style={styles.promoOriginal}>
                {formatCurrency(featuredPromotion.originalPrice)}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>NEGOCIOS</Text>
          <Text style={styles.sectionTitle}>Discovery móvil-first</Text>
        </View>

        {approvedBusinesses.map((business) => (
          <View key={business.id} style={styles.businessCard}>
            <View style={styles.businessRow}>
              <View style={styles.logoBadge}>
                <BrandLogo size={40} subtitle={false} variant="mark" />
              </View>
              <View style={styles.businessMeta}>
                <Text style={styles.businessName}>{business.name}</Text>
                <Text style={styles.businessSubline}>
                  {business.location.zone} ·{' '}
                  {business.category.replace('_', ' ')}
                </Text>
                <Text style={styles.businessSubline}>
                  {business.rating.toFixed(1)} estrellas ·{' '}
                  {business.reviewCount} reseñas
                </Text>
              </View>
            </View>
            <Text style={styles.businessDescription}>
              {business.description}
            </Text>
            {business.promotion ? (
              <Text style={styles.promoFlag}>
                Promo: {business.promotion.title}
              </Text>
            ) : null}
            <Pressable
              onPress={() =>
                Linking.openURL(
                  buildWhatsAppLink(
                    business.whatsappNumber,
                    `Hola ${business.name}, vi su perfil en EncuentraloTodo.`,
                  ),
                )
              }
              style={styles.whatsAppButton}
            >
              <Text style={styles.whatsAppLabel}>Contactar por WhatsApp</Text>
            </Pressable>
          </View>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {featuredBusiness ? (
        <Pressable
          onPress={() =>
            Linking.openURL(
              buildWhatsAppLink(
                featuredBusiness.whatsappNumber,
                `Hola ${featuredBusiness.name}, quiero más información.`,
              ),
            )
          }
          style={styles.floatingButton}
        >
          <Text style={styles.floatingButtonLabel}>WhatsApp rápido</Text>
        </Pressable>
      ) : null}

      <View style={styles.bottomNav}>
        {['Home', 'Buscar', 'Favoritos', 'Perfil'].map((item, index) => (
          <View
            key={item}
            style={[
              styles.bottomNavItem,
              index === 0 && styles.bottomNavItemActive,
            ]}
          >
            <Text
              style={[
                styles.bottomNavLabel,
                index === 0 && styles.bottomNavLabelActive,
              ]}
            >
              {item}
            </Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};

export default App;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 16,
  },
  heroCard: {
    backgroundColor: palette.primary,
    borderRadius: 28,
    padding: 20,
    gap: 10,
  },
  heroEyebrow: {
    color: palette.secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },
  heroText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    lineHeight: 22,
  },
  searchBox: {
    backgroundColor: palette.surface,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: palette.border,
  },
  searchInput: {
    height: 44,
    color: palette.text,
  },
  chipsRow: {
    flexGrow: 0,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  chipLabel: {
    color: palette.primary,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },
  promoCard: {
    backgroundColor: palette.accent,
    borderRadius: 28,
    padding: 20,
    gap: 8,
  },
  promoEyebrow: {
    color: palette.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  promoTitle: {
    color: palette.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  promoText: {
    color: palette.primary,
    fontSize: 14,
    lineHeight: 22,
  },
  promoPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  promoPrice: {
    color: palette.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  promoOriginal: {
    color: 'rgba(31,60,90,0.66)',
    textDecorationLine: 'line-through',
  },
  sectionHeader: {
    gap: 4,
  },
  sectionEyebrow: {
    color: palette.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  sectionTitle: {
    color: palette.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  businessCard: {
    backgroundColor: palette.surface,
    borderRadius: 28,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  businessRow: {
    flexDirection: 'row',
    gap: 12,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: 'rgba(79,191,159,0.18)',
    justifyContent: 'center',
  },
  businessMeta: {
    flex: 1,
    gap: 4,
  },
  businessName: {
    color: palette.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  businessSubline: {
    color: palette.textMuted,
    fontSize: 12,
  },
  businessDescription: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  promoFlag: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  whatsAppButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: palette.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  whatsAppLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  floatingButton: {
    position: 'absolute',
    right: 16,
    bottom: 84,
    borderRadius: 999,
    backgroundColor: palette.secondary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  floatingButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bottomNav: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 999,
    padding: 8,
    borderWidth: 1,
    borderColor: palette.border,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 999,
  },
  bottomNavItemActive: {
    backgroundColor: palette.primary,
  },
  bottomNavLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  bottomNavLabelActive: {
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 30,
  },
});
