<template>
  <div>
    <b-modal
      ref="chooser"
      size="lg"
      title="Choose a station to go to"
      ok-only
      v-bind:ok-disabled="currentArticle == null"
      @ok="$emit('article-chosen', currentArticle)"
    >
      <b-container fluid>
        <b-row>
          <b-col>
            <b-row v-bind:key="article.title" v-for="article in articles.slice(0, 4)">
              <Article
                v-bind:title="article.title"
                v-bind:description="article.description"
                v-bind:imageURL="article.imageURL"
                @article-changed="articleChanged($event)"
              />
            </b-row>
          </b-col>
          <b-col>
            <b-row v-bind:key="article.title" v-for="article in articles.slice(4, 8)">
              <Article
                v-bind:title="article.title"
                v-bind:description="article.description"
                v-bind:imageURL="article.imageURL"
                @article-changed="articleChanged($event)"
              />
            </b-row>
          </b-col>
        </b-row>
      </b-container>
    </b-modal>
  </div>
</template>

<script>
import Article from "@/components/Article";

export default {
  name: "PopUpArticleChooser",
  components: {
    Article,
  },
  props: {
    articles: { type: Array },
  },
  data() {
    return {
      // the current article selected in the chooser (string)
      currentArticle: null,
    };
  },
  mounted() {
    this.$refs["chooser"].show();
  },
  methods: {
    articleChanged(newArticle) {
      this.currentArticle = newArticle;
    },
  },
};
</script>

<style scoped>
</style>