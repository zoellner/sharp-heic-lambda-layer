# Library Versions
WEBP_VERSION=1.3.2
LIBDE265_VERSION=1.0.12
LIBHEIF_VERSION=1.17.1
VIPS_VERSION=8.14.5
SHARP_VERSION=0.32.6

PREFIX_PATH=/usr/local
LIB_PATH=$(PREFIX_PATH)/lib64
LIBRARY_PATH=$(LIB_PATH)
EXAMPLE_IMAGE_PATH=$(CURDIR)/example-images

export PKG_CONFIG_PATH=$(LIB_PATH)/pkgconfig
export LD_LIBRARY_PATH=$(LIB_PATH):$$LD_LIBRARY_PATH

build-SharpHEICLayer: libvips
	mkdir -p "$(ARTIFACTS_DIR)/nodejs"
	mkdir -p "$(ARTIFACTS_DIR)/lib"

	# sharp uses several of the libs we installed or compiled. extract the full list and copy all of those into $(ARTIFACTS_DIR)/lib
	# extract list with ldd from sharp.node, manipulate a bit to only get the absolute paths, then copy

	PKG_CONFIG_PATH=$(LIB_PATH)/pkgconfig LD_LIBRARY_PATH=$(LIB_PATH) npm install --prefix "$(ARTIFACTS_DIR)/nodejs/" --verbose --foreground-scripts sharp@$(SHARP_VERSION)
	PKG_CONFIG_PATH=$(LIB_PATH)/pkgconfig LD_LIBRARY_PATH=$(LIB_PATH) ldd $(ARTIFACTS_DIR)/nodejs/node_modules/sharp/build/Release/sharp-linux-x64.node | awk 'BEGIN{OFS=" "}{ print $$3 }' | grep '/' | xargs -I '{}' cp '{}' $(ARTIFACTS_DIR)/lib

	# debug logs
	PKG_CONFIG_PATH=$(LIB_PATH)/pkgconfig LD_LIBRARY_PATH=$(LIB_PATH) ldd $(ARTIFACTS_DIR)/nodejs/node_modules/sharp/build/Release/sharp-linux-x64.node
	ls -la $(ARTIFACTS_DIR)/lib

libwebp:
	curl -L https://github.com/webmproject/libwebp/archive/v$(WEBP_VERSION).tar.gz | tar zx
	cd libwebp-$(WEBP_VERSION) && ./autogen.sh && ./configure --enable-libwebpmux --prefix=$(PREFIX_PATH) && make V=0 && make install

libde265:
	curl -L https://github.com/strukturag/libde265/releases/download/v$(LIBDE265_VERSION)/libde265-$(LIBDE265_VERSION).tar.gz | tar zx
	cd libde265-$(LIBDE265_VERSION) && ./autogen.sh && ./configure --disable-dec265 --disable-sherlock265 --prefix=$(PREFIX_PATH) && make V=0 && make install

libheif: libde265
	# libheif
	curl -L https://github.com/strukturag/libheif/releases/download/v$(LIBHEIF_VERSION)/libheif-$(LIBHEIF_VERSION).tar.gz | tar zx
	cd libheif-$(LIBHEIF_VERSION) && mkdir build && cd build && cmake -DCMAKE_INSTALL_LIBDIR=$(LIB_PATH) --preset=release .. && make && make install

libvips: installLib
	# libvips
	curl -L https://github.com/libvips/libvips/releases/download/v$(VIPS_VERSION)/vips-$(VIPS_VERSION).tar.xz | tar xJ
	cd vips-$(VIPS_VERSION) && meson setup build -Dexamples=true && cd build && meson compile && meson test && meson install

# libheif: libde265
# 	# libheif
# 	curl -L https://github.com/strukturag/libheif/releases/download/v$(LIBHEIF_VERSION)/libheif-$(LIBHEIF_VERSION).tar.gz | tar zx
# 	cd libheif-$(LIBHEIF_VERSION) && ./autogen.sh && ./configure --prefix=$(PREFIX_PATH) && make V=0 && make install
# 	cd libheif-$(LIBHEIF_VERSION)/examples && ./heif-convert example.heic example.jpeg && cp example*.jpeg $(EXAMPLE_IMAGE_PATH) && cp example.heic $(EXAMPLE_IMAGE_PATH)

# libvips: installLib libheif libwebp
# 	# libvips
# 	curl -L https://github.com/libvips/libvips/releases/download/v$(VIPS_VERSION)/vips-$(VIPS_VERSION).tar.gz | tar zx
# 	cd vips-$(VIPS_VERSION) && ./configure --prefix=$(PREFIX_PATH) && make V=0 && make install
# 	cd vips-$(VIPS_VERSION)/tools && ./vips rot $(EXAMPLE_IMAGE_PATH)/example.heic $(EXAMPLE_IMAGE_PATH)/example-rot.jpeg d90

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
