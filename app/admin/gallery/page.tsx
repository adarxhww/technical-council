"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type GalleryItem = {
  id: string;
  title: string;
  category: string;
  date: string;
  image_path: string;
  image_url: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

type GalleryCategory = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

const supabase = createClient();

export default function GalleryPage() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] =
    useState<GalleryItem | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePath, setImagePath] = useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState("");

  const [showCategoryManager, setShowCategoryManager] =
    useState(false);

  const [newCategoryName, setNewCategoryName] =
    useState("");

  const [editingCategory, setEditingCategory] =
    useState<string | null>(null);

  const [editingCategoryName, setEditingCategoryName] =
    useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(
    null
  );

  const publishedCount = gallery.filter(
    (item) => item.published
  ).length;

  const hiddenCount =
    gallery.length - publishedCount;

  /*
   * ==========================================================
   * LOAD DATA
   * ==========================================================
   */

  async function loadGallery() {
    const { data, error } = await supabase
      .from("gallery_items")
      .select(
        `
          id,
          title,
          category,
          date,
          image_path,
          image_url,
          published,
          created_at,
          updated_at
        `
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Gallery load error:", error);
      return;
    }

    setGallery((data ?? []) as GalleryItem[]);
  }

  async function loadCategories() {
    const { data, error } = await supabase
      .from("gallery_categories")
      .select(
        `
          id,
          name,
          created_at,
          updated_at
        `
      )
      .order("name", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Gallery categories load error:",
        error
      );
      return;
    }

    setCategories(
      (data ?? []) as GalleryCategory[]
    );
  }

  async function loadAll() {
    setLoading(true);

    await Promise.all([
      loadGallery(),
      loadCategories(),
    ]);

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  /*
   * ==========================================================
   * FILTERING
   * ==========================================================
   */

  const filteredGallery = useMemo(() => {
    const query = search.toLowerCase().trim();

    return gallery.filter((item) => {
      const matchesSearch =
        !query ||
        item.title
          .toLowerCase()
          .includes(query) ||
        item.category
          .toLowerCase()
          .includes(query) ||
        item.date
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        categoryFilter === "All" ||
        item.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [
    gallery,
    search,
    categoryFilter,
  ]);

  /*
   * ==========================================================
   * FORM
   * ==========================================================
   */

  function resetForm() {
    setTitle("");
    setCategory("");
    setDate("");
    setImageUrl("");
    setImagePath("");
    setSelectedFile(null);
    setPreviewUrl("");
    setEditingItem(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openAddModal() {
    resetForm();

    if (categories.length > 0) {
      setCategory(categories[0].name);
    }

    setShowModal(true);
  }

  function openEditModal(item: GalleryItem) {
    setEditingItem(item);

    setTitle(item.title);
    setCategory(item.category);
    setDate(item.date);
    setImageUrl(item.image_url);
    setImagePath(item.image_path);
    setSelectedFile(null);
    setPreviewUrl(item.image_url);

    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    resetForm();
  }

  /*
   * ==========================================================
   * IMAGE SELECTION
   * ==========================================================
   */

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      window.alert(
        "Please select a valid image file."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      window.alert(
        "Image size must be 10 MB or smaller."
      );

      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    const localPreview =
      URL.createObjectURL(file);

    setPreviewUrl(localPreview);
  }

  /*
   * ==========================================================
   * STORAGE UPLOAD
   * ==========================================================
   */

  async function uploadImage(
    file: File
  ): Promise<{
    path: string;
    url: string;
  } | null> {
    const extension =
      file.name.split(".").pop()?.toLowerCase() ||
      "jpg";

    const fileName = `${crypto.randomUUID()}.${extension}`;

    const path = `photos/${fileName}`;

    const { error } = await supabase.storage
      .from("gallery")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error(
        "Gallery image upload error:",
        error
      );

      window.alert(
        `Unable to upload image: ${error.message}`
      );

      return null;
    }

    const {
      data: publicUrlData,
    } = supabase.storage
      .from("gallery")
      .getPublicUrl(path);

    return {
      path,
      url: publicUrlData.publicUrl,
    };
  }

  /*
   * ==========================================================
   * SAVE GALLERY ITEM
   * ==========================================================
   */

  async function saveGalleryItem() {
    if (
      !title.trim() ||
      !category.trim() ||
      !date.trim()
    ) {
      return;
    }

    if (
      !editingItem &&
      !selectedFile
    ) {
      window.alert(
        "Please select a photo."
      );

      return;
    }

    setSaving(true);

    try {
      let finalImagePath = imagePath;
      let finalImageUrl = imageUrl;
      let uploadedNewImage = false;

      /*
       * Upload new image if selected.
       */
      if (selectedFile) {
        const uploaded =
          await uploadImage(selectedFile);

        if (!uploaded) {
          setSaving(false);
          return;
        }

        finalImagePath = uploaded.path;
        finalImageUrl = uploaded.url;
        uploadedNewImage = true;
      }

      /*
       * Update existing item.
       */
      if (editingItem) {
        const { error } = await supabase
          .from("gallery_items")
          .update({
            title: title.trim(),
            category: category.trim(),
            date: date.trim(),
            image_path: finalImagePath,
            image_url: finalImageUrl,
          })
          .eq("id", editingItem.id);

        if (error) {
          console.error(
            "Gallery update error:",
            error
          );

          if (uploadedNewImage) {
            await supabase.storage
              .from("gallery")
              .remove([finalImagePath]);
          }

          window.alert(
            `Unable to save changes: ${error.message}`
          );

          return;
        }

        /*
         * Remove old image only after DB update
         * succeeded.
         */
        if (
          uploadedNewImage &&
          editingItem.image_path &&
          editingItem.image_path !== finalImagePath
        ) {
          await supabase.storage
            .from("gallery")
            .remove([
              editingItem.image_path,
            ]);
        }
      } else {
        /*
         * Create new item.
         */
        const { error } = await supabase
          .from("gallery_items")
          .insert({
            title: title.trim(),
            category: category.trim(),
            date: date.trim(),
            image_path: finalImagePath,
            image_url: finalImageUrl,
            published: false,
          });

        if (error) {
          console.error(
            "Gallery insert error:",
            error
          );

          if (uploadedNewImage) {
            await supabase.storage
              .from("gallery")
              .remove([finalImagePath]);
          }

          window.alert(
            `Unable to add photo: ${error.message}`
          );

          return;
        }
      }

      /*
       * Make sure manually typed categories
       * exist in the category manager.
       */
      const categoryExists =
        categories.some(
          (item) =>
            item.name.toLowerCase() ===
            category
              .trim()
              .toLowerCase()
        );

      if (!categoryExists) {
        await supabase
          .from("gallery_categories")
          .insert({
            name: category.trim(),
          });
      }

      await loadAll();

      closeModal();
    } finally {
      setSaving(false);
    }
  }

  /*
   * ==========================================================
   * PUBLISH / HIDE
   * ==========================================================
   */

  async function togglePublished(
    item: GalleryItem
  ) {
    const nextPublished =
      !item.published;

    const { error } = await supabase
      .from("gallery_items")
      .update({
        published: nextPublished,
      })
      .eq("id", item.id);

    if (error) {
      console.error(
        "Publish toggle error:",
        error
      );

      window.alert(
        `Unable to update publication status: ${error.message}`
      );

      return;
    }

    setGallery((current) =>
      current.map((galleryItem) =>
        galleryItem.id === item.id
          ? {
              ...galleryItem,
              published: nextPublished,
            }
          : galleryItem
      )
    );
  }

  /*
   * ==========================================================
   * DELETE
   * ==========================================================
   */

  async function deleteItem(
    item: GalleryItem
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to permanently delete "${item.title}"?`
      );

    if (!confirmed) {
      return;
    }

    const { error: dbError } =
      await supabase
        .from("gallery_items")
        .delete()
        .eq("id", item.id);

    if (dbError) {
      console.error(
        "Gallery delete error:",
        dbError
      );

      window.alert(
        `Unable to delete photo: ${dbError.message}`
      );

      return;
    }

    if (item.image_path) {
      const { error: storageError } =
        await supabase.storage
          .from("gallery")
          .remove([item.image_path]);

      if (storageError) {
        console.error(
          "Storage image delete error:",
          storageError
        );
      }
    }

    setGallery((current) =>
      current.filter(
        (galleryItem) =>
          galleryItem.id !== item.id
      )
    );
  }

  /*
   * ==========================================================
   * CATEGORY MANAGEMENT
   * ==========================================================
   */

  async function addCategory() {
    const cleanedName =
      newCategoryName.trim();

    if (!cleanedName) {
      return;
    }

    const alreadyExists =
      categories.some(
        (item) =>
          item.name.toLowerCase() ===
          cleanedName.toLowerCase()
      );

    if (alreadyExists) {
      window.alert(
        "A category with this name already exists."
      );
      return;
    }

    const { error } =
      await supabase
        .from("gallery_categories")
        .insert({
          name: cleanedName,
        });

    if (error) {
      console.error(
        "Category creation error:",
        error
      );

      window.alert(
        `Unable to create category: ${error.message}`
      );

      return;
    }

    setNewCategoryName("");

    await loadCategories();
  }

  function startRenameCategory(
    categoryItem: GalleryCategory
  ) {
    setEditingCategory(
      categoryItem.id
    );

    setEditingCategoryName(
      categoryItem.name
    );
  }

  function cancelRenameCategory() {
    setEditingCategory(null);
    setEditingCategoryName("");
  }

  async function saveRenamedCategory(
    categoryItem: GalleryCategory
  ) {
    const cleanedName =
      editingCategoryName.trim();

    if (!cleanedName) {
      return;
    }

    const duplicateExists =
      categories.some(
        (item) =>
          item.id !== categoryItem.id &&
          item.name.toLowerCase() ===
            cleanedName.toLowerCase()
      );

    if (duplicateExists) {
      window.alert(
        "A category with this name already exists."
      );

      return;
    }

    const { error } =
      await supabase
        .from("gallery_categories")
        .update({
          name: cleanedName,
        })
        .eq("id", categoryItem.id);

    if (error) {
      console.error(
        "Category rename error:",
        error
      );

      window.alert(
        `Unable to rename category: ${error.message}`
      );

      return;
    }

    /*
     * Update gallery items using old category.
     */
    await supabase
      .from("gallery_items")
      .update({
        category: cleanedName,
      })
      .eq("category", categoryItem.name);

    if (
      categoryFilter === categoryItem.name
    ) {
      setCategoryFilter(cleanedName);
    }

    if (
      category === categoryItem.name
    ) {
      setCategory(cleanedName);
    }

    cancelRenameCategory();

    await loadAll();
  }

  async function deleteCategory(
    categoryItem: GalleryCategory
  ) {
    const itemsUsingCategory =
      gallery.filter(
        (item) =>
          item.category ===
          categoryItem.name
      );

    if (itemsUsingCategory.length > 0) {
      window.alert(
        `You cannot delete "${categoryItem.name}" because ${itemsUsingCategory.length} gallery ${
          itemsUsingCategory.length === 1
            ? "item is"
            : "items are"
        } using this category.\n\nChange those gallery items to another category first.`
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Delete the "${categoryItem.name}" category?`
      );

    if (!confirmed) {
      return;
    }

    const { error } =
      await supabase
        .from("gallery_categories")
        .delete()
        .eq("id", categoryItem.id);

    if (error) {
      console.error(
        "Category delete error:",
        error
      );

      window.alert(
        `Unable to delete category: ${error.message}`
      );

      return;
    }

    if (
      categoryFilter === categoryItem.name
    ) {
      setCategoryFilter("All");
    }

    if (
      category === categoryItem.name
    ) {
      setCategory("");
    }

    await loadCategories();
  }

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="min-h-screen w-full bg-transparent">
      <div className="w-full px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
        <div className="mx-auto w-full max-w-[1500px]">

          {/* HEADER */}

          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link
                href="/admin"
                className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </Link>

              <p className="mb-1 text-sm font-medium text-slate-500">
                Admin Portal
              </p>

              <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                Gallery
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage photos and memories displayed on
                the Technical Council website.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  setShowCategoryManager(true)
                }
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
              >
                <Pencil size={16} />
                Manage Categories
              </button>

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-700"
              >
                <Plus size={17} />
                Add Photo
              </button>
            </div>
          </div>

          {/* STATS */}

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total Photos
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {gallery.length}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <ImagePlus size={19} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                All gallery items
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Published
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {publishedCount}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <CheckCircle2 size={19} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Visible on the website
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Hidden
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {hiddenCount}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <EyeOff size={19} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Not visible to visitors
              </p>
            </div>
          </section>

          {/* GALLERY MANAGEMENT */}

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">
                    Gallery Items
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Manage photos that appear in the
                    public gallery.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative w-full sm:w-64">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value
                        )
                      }
                      placeholder="Search gallery..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                    />
                  </div>

                  <select
                    value={categoryFilter}
                    onChange={(event) =>
                      setCategoryFilter(
                        event.target.value
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                  >
                    <option value="All">
                      All Categories
                    </option>

                    {categories.map(
                      (option) => (
                        <option
                          key={option.id}
                          value={option.name}
                        >
                          {option.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-5">
              {loading ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {Array.from({
                    length: 4,
                  }).map((_, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    >
                      <div className="aspect-[4/3] animate-pulse bg-slate-100" />

                      <div className="space-y-3 p-4">
                        <div className="h-4 animate-pulse rounded bg-slate-100" />
                        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                        <div className="h-9 animate-pulse rounded-xl bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredGallery.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {filteredGallery.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />

                          <div className="absolute left-3 top-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur-md ${
                                item.published
                                  ? "bg-emerald-50/95 text-emerald-700"
                                  : "bg-white/90 text-slate-500"
                              }`}
                            >
                              {item.published
                                ? "Published"
                                : "Hidden"}
                            </span>
                          </div>

                          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/35 opacity-0 backdrop-blur-[1px] transition group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() =>
                                window.open(
                                  item.image_url,
                                  "_blank"
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-lg transition hover:bg-slate-50"
                              title="View image"
                            >
                              <Eye size={17} />
                            </button>
                          </div>
                        </div>

                        <div className="p-4">
                          <h3 className="truncate text-sm font-semibold text-slate-900">
                            {item.title}
                          </h3>

                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                              {item.category}
                            </span>

                            <span className="text-[11px] text-slate-400">
                              {item.date}
                            </span>
                          </div>

                          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                            <button
                              type="button"
                              onClick={() =>
                                togglePublished(
                                  item
                                )
                              }
                              className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                                item.published
                                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {item.published ? (
                                <span className="inline-flex items-center justify-center gap-1.5">
                                  <EyeOff size={13} />
                                  Hide
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center gap-1.5">
                                  <Eye size={13} />
                                  Publish
                                </span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  item
                                )
                              }
                              title="Edit photo"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteItem(
                                  item
                                )
                              }
                              title="Delete photo"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                  <ImagePlus
                    size={30}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-4 text-sm font-semibold text-slate-600">
                    No gallery items found
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Add your first gallery photo or
                    change the filters.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 p-5 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.20)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {editingItem
                    ? "Edit Gallery Item"
                    : "Add Gallery Photo"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Upload and manage the photo below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <X size={17} />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">

              {/* IMAGE */}

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-500">
                  Photo
                </label>

                {previewUrl ? (
                  <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-48 w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(
                          editingItem
                            ? editingItem.image_url
                            : ""
                        );

                        if (
                          fileInputRef.current
                        ) {
                          fileInputRef.current.value =
                            "";
                        }
                      }}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-slate-600 shadow-sm transition hover:bg-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center transition hover:border-blue-300 hover:bg-blue-50/30"
                  >
                    <Upload
                      size={25}
                      className="text-slate-400"
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      Choose a photo
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      JPG, PNG, WEBP up to 10 MB
                    </p>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {previewUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Choose a different photo
                  </button>
                )}
              </div>

              {/* TITLE */}

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-500">
                  Photo Title
                </label>

                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Technical Council Orientation"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                />
              </div>

              {/* CATEGORY + DATE */}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-500">
                      Category
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setShowCategoryManager(
                          true
                        )
                      }
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Manage
                    </button>
                  </div>

                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map(
                      (option) => (
                        <option
                          key={option.id}
                          value={option.name}
                        >
                          {option.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-500">
                    Date
                  </label>

                  <input
                    value={date}
                    onChange={(event) =>
                      setDate(
                        event.target.value
                      )
                    }
                    placeholder="e.g. September 2026"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveGalleryItem}
                disabled={
                  saving ||
                  !title.trim() ||
                  !category.trim() ||
                  !date.trim() ||
                  (!selectedFile &&
                    !editingItem)
                }
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-emerald-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}

                {editingItem
                  ? "Save Changes"
                  : "Add Photo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          CATEGORY MANAGER
      ===================================================== */}

      {showCategoryManager && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/30 p-5 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowCategoryManager(false);
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.20)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Manage Categories
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Create or rename categories used by
                  the gallery.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCategoryManager(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <X size={17} />
              </button>
            </div>

            <div className="border-b border-slate-100 p-5">
              <label className="mb-2 block text-xs font-semibold text-slate-500">
                Add New Category
              </label>

              <div className="flex gap-2">
                <input
                  value={newCategoryName}
                  onChange={(event) =>
                    setNewCategoryName(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addCategory();
                    }
                  }}
                  placeholder="e.g. Tech Fusion 2026"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                />

                <button
                  type="button"
                  onClick={addCategory}
                  disabled={
                    !newCategoryName.trim()
                  }
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-emerald-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </div>

            <div className="max-h-[55vh] space-y-2 overflow-y-auto p-5">
              {categories.map(
                (categoryItem) => {
                  const itemCount =
                    gallery.filter(
                      (item) =>
                        item.category ===
                        categoryItem.name
                    ).length;

                  const isEditing =
                    editingCategory ===
                    categoryItem.id;

                  return (
                    <div
                      key={categoryItem.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      {isEditing ? (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            autoFocus
                            value={
                              editingCategoryName
                            }
                            onChange={(event) =>
                              setEditingCategoryName(
                                event.target.value
                              )
                            }
                            onKeyDown={(event) => {
                              if (
                                event.key ===
                                "Enter"
                              ) {
                                saveRenamedCategory(
                                  categoryItem
                                );
                              }

                              if (
                                event.key ===
                                "Escape"
                              ) {
                                cancelRenameCategory();
                              }
                            }}
                            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/[0.08]"
                          />

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                saveRenamedCategory(
                                  categoryItem
                                )
                              }
                              disabled={
                                !editingCategoryName.trim()
                              }
                              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:from-emerald-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                            >
                              Save
                            </button>

                            <button
                              type="button"
                              onClick={
                                cancelRenameCategory
                              }
                              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 sm:flex-none"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {categoryItem.name}
                            </p>

                            <p className="mt-0.5 text-[11px] text-slate-400">
                              {itemCount}{" "}
                              {itemCount === 1
                                ? "photo"
                                : "photos"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              startRenameCategory(
                                categoryItem
                              )
                            }
                            title="Rename category"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteCategory(
                                categoryItem
                              )
                            }
                            title="Delete category"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-4">
              <button
                type="button"
                onClick={() =>
                  setShowCategoryManager(false)
                }
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}