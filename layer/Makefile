# Library Versions
WEBP_VERSION=1.2.4
LIBDE265_VERSION=1.0.8
LIBHEIF_VERSION=1.12.0
VIPS_VERSION=8.12.2
SHARP_VERSION=0.30.7

PREFIX_PATH=/opt
LIB_PATH=$(PREFIX_PATH)/lib

export PKG_CONFIG_PATH=$(LIB_PATH)/pkgconfig
export LIBRARY_PATH=$(LIB_PATH):/usr/local/lib64

build-SharpHEICLayer: libvips
	mkdir -p "$(ARTIFACTS_DIR)/nodejs"
	mkdir -p "$(ARTIFACTS_DIR)/lib"

	# sharp uses several of the libs we installed or compiled. extract the full list and copy all of those into /opt/lib
	# extract list with ldd from sharp.node, manipulate a bit with sed to only get the absolute paths, then copy
	LD_LIBRARY_PATH=$(LIBRARY_PATH) npm install --prefix "$(ARTIFACTS_DIR)/nodejs/" --verbose --platform=linux --arch=x64 sharp@$(SHARP_VERSION)
	LD_LIBRARY_PATH=$(LIBRARY_PATH) ldd $(ARTIFACTS_DIR)/nodejs/node_modules/sharp/build/Release/sharp-linux-x64.node | sed -nE "s/^[^\/\n]*(\/[^ ]+)(.*)/\1/p" | xargs cp -t $(ARTIFACTS_DIR)/lib64
	ls -la $(ARTIFACTS_DIR)/lib

libwebp:
	curl -L https://github.com/webmproject/libwebp/archive/v$(WEBP_VERSION).tar.gz | tar zx
	cd libwebp-$(WEBP_VERSION) && ./autogen.sh && ./configure --enable-libwebpmux --prefix=$(PREFIX_PATH) && make V=0 && make install

libde265:
	# libde265
	curl -L https://github.com/strukturag/libde265/releases/download/v$(LIBDE265_VERSION)/libde265-$(LIBDE265_VERSION).tar.gz | tar zx
	cd libde265-$(LIBDE265_VERSION) && ./autogen.sh && ./configure --disable-dec265 --disable-sherlock265 --prefix=$(PREFIX_PATH) && make V=0 && make install

# libheif: libde265
# 	# libheif
# 	curl -L https://github.com/strukturag/libheif/releases/download/v$(LIBHEIF_VERSION)/libheif-$(LIBHEIF_VERSION).tar.gz | tar zx
# 	cd libheif-$(LIBHEIF_VERSION) && mkdir build && cd build && cmake -DCMAKE_INSTALL_LIBDIR=$(LIB_PATH) --preset=release .. && make && make install

# libvips install command for latest version
# libvips: installLib libheif libwebp
# 	# libvips
# 	curl -L https://github.com/libvips/libvips/releases/download/v$(VIPS_VERSION)/vips-$(VIPS_VERSION).tar.xz | tar xJ
# 	cd vips-$(VIPS_VERSION) && meson setup build -Dexamples=false -Dheif=enabled -Dlcms=enabled && cd build && meson compile && meson test && meson install

libheif: libde265
	# libheif
	curl -L https://github.com/strukturag/libheif/releases/download/v$(LIBHEIF_VERSION)/libheif-$(LIBHEIF_VERSION).tar.gz | tar zx
	cd libheif-$(LIBHEIF_VERSION) && ./autogen.sh && ./configure --prefix=$(PREFIX_PATH) && make V=0 && make install

libvips: installLib libheif libwebp
	# libvips
	curl -L https://github.com/libvips/libvips/releases/download/v$(VIPS_VERSION)/vips-$(VIPS_VERSION).tar.gz | tar zx
	cd vips-$(VIPS_VERSION) && ./configure --prefix=$(PREFIX_PATH) && make V=0 && make install


installLib:
	dnf groupinstall -y "Development Tools" -x system-rpm-config && \
	dnf install -y \
		glib2-devel \
		expat-devel \
		libjpeg-turbo-devel \
		libpng-devel \
		giflib-devel \
		libexif-devel \
		librsvg2-devel \
		libtiff-devel \
		lcms2-devel \
		gobject-introspection-devel \
		cmake \
		pkgconfig \
		meson \
		ninja-build

